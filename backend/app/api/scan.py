# backend/app/api/scan.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
from datetime import datetime
import os
import hashlib
import aiofiles
from bson import ObjectId

from app.config import settings
from app.utils.database import get_database
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/scan", tags=["Scanning"])


def to_oid(id_str: str) -> ObjectId:
    """Convert string to ObjectId, raise 400 if invalid"""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scan id")


def get_file_hash(file_path: str) -> str:
    """Compute SHA256 hash of file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


async def save_upload_file(upload_file: UploadFile, user_id: str) -> tuple[str, str, int]:
    """
    Save uploaded file to disk.
    Returns: (file_path, filename, file_size)
    """
    if not upload_file or not upload_file.filename:
        raise HTTPException(status_code=400, detail="No file provided (field must be named 'file')")

    # Create user upload directory
    user_dir = os.path.join(settings.UPLOAD_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)

    # Validate extension (case-insensitive) with leading dot (e.g., .exe)
    _, ext = os.path.splitext(upload_file.filename)
    ext = ext.lower().strip()

    # Normalize allowed list (should already be lowercase with dots)
    allowed_lower = [e.lower().strip() for e in settings.ALLOWED_EXTENSIONS]

    # DEBUG: Print what we're checking
    print(f"DEBUG: Checking extension '{ext}' against allowed: {allowed_lower}")
    print(f"DEBUG: Full filename: {upload_file.filename}")
    print(f"DEBUG: Config ALLOWED_EXTENSIONS: {settings.ALLOWED_EXTENSIONS}")

    if ext not in allowed_lower:
        allowed_text = ", ".join(settings.ALLOWED_EXTENSIONS)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {ext} not allowed. Allowed: {allowed_text}"
        )

    # Read content
    try:
        content = await upload_file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    file_size = len(content)

    # Validate file size
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE / (1024*1024):.0f}MB"
        )

    # Save with unique filename
    unique_filename = f"{datetime.utcnow().timestamp()}_{upload_file.filename}"
    file_path = os.path.join(user_dir, unique_filename)

    try:
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    return file_path, unique_filename, file_size


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Upload a file for malware scanning.
    Expected:
    - Authorization: Bearer <token>
    - Content-Type: multipart/form-data
    - Body: file=<binary>
    """
    print(f"📤 Upload request from user: {current_user.get('user_id')}")
    print(f"📄 File: {file.filename if file else 'None'}")

    if not file:
        raise HTTPException(status_code=400, detail="No file in request")

    # Save file (validates extension/size)
    try:
        file_path, filename, file_size = await save_upload_file(file, current_user["user_id"])
        print(f"✅ File saved: {file_path} ({file_size} bytes)")
    except HTTPException as e:
        print(f"❌ Upload validation error: {e.detail}")
        raise
    except Exception as e:
        print(f"❌ Save failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create scan document
    ext = os.path.splitext(filename)[1].lower()
    scan_doc = {
        "filename": filename,
        "file_size": file_size,
        "file_type": ext,
        "user_id": str(current_user["user_id"]),  # Ensure string
        "status": "uploaded",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "detection_result": None,
        "is_zero_day": False,
        "confidence_score": None,
        "scan_duration": None,
    }

    try:
        result = await db.scans.insert_one(scan_doc)
        scan_id = str(result.inserted_id)
        print(f"✅ Scan document created: {scan_id}")
    except Exception as e:
        print(f"❌ DB insert failed: {str(e)}")
        # Clean up file
        try:
            os.remove(file_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to create scan: {str(e)}")

    return {
        "id": scan_id,
        "filename": scan_doc["filename"],
        "file_type": scan_doc["file_type"],
        "status": scan_doc["status"],
        "created_at": scan_doc["created_at"],
        "detection_result": scan_doc["detection_result"],
        "is_zero_day": scan_doc["is_zero_day"],
    }


@router.post("/{scan_id}/start", status_code=status.HTTP_200_OK)
async def start_scan(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Start malware scan for an uploaded file.
    """
    _id = to_oid(scan_id)
    scan = await db.scans.find_one({"_id": _id})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if str(scan["user_id"]) != str(current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to access this scan")

    # Update status to scanning
    await db.scans.update_one({"_id": _id}, {"$set": {"status": "scanning", "updated_at": datetime.utcnow()}})

    # Perform mock scan
    file_path = os.path.join(settings.UPLOAD_DIR, str(scan["user_id"]), scan["filename"])
    try:
        import time
        start_time = time.time()

        # TODO: Integrate real detector here
        result = "benign"
        confidence = 0.88
        is_zero_day = False
        explanation = {
            "risk_factors": [],
            "feature_importance": [
                {"feature_name": "Syscalls", "importance": 0.42, "description": "System call patterns"},
                {"feature_name": "Entropy", "importance": 0.31, "description": "High entropy regions"},
            ],
            "summary": "The model classified this file as benign based on features.",
        }

        duration = time.time() - start_time
        file_hash = get_file_hash(file_path) if os.path.exists(file_path) else None

        update = {
            "status": "completed",
            "detection_result": result,
            "confidence_score": confidence,
            "is_zero_day": is_zero_day,
            "explanation": explanation,
            "file_hash": file_hash,
            "scan_duration": duration,
            "updated_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
        }
        await db.scans.update_one({"_id": _id}, {"$set": update})

        updated = await db.scans.find_one({"_id": _id})
        return {
            "id": str(updated["_id"]),
            "filename": updated["filename"],
            "file_type": updated.get("file_type"),
            "status": updated.get("status"),
            "created_at": updated["created_at"],
            "detection_result": updated.get("detection_result"),
            "is_zero_day": updated.get("is_zero_day", False),
        }

    except Exception as e:
        await db.scans.update_one(
            {"_id": _id},
            {"$set": {"status": "failed", "updated_at": datetime.utcnow()}}
        )
        raise HTTPException(status_code=500, detail=f"Scanning failed: {str(e)}")


@router.get("/{scan_id}", status_code=status.HTTP_200_OK)
async def get_scan_result(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get detailed scan result including explanation and confidence.
    """
    _id = to_oid(scan_id)
    scan = await db.scans.find_one({"_id": _id})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if str(scan["user_id"]) != str(current_user["user_id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this scan")

    return {
        "id": str(scan["_id"]),
        "filename": scan["filename"],
        "detection_result": scan.get("detection_result", "benign"),
        "confidence_score": scan.get("confidence_score", 0.85),
        "scan_duration": scan.get("scan_duration", 1.23),
        "is_zero_day": scan.get("is_zero_day", False),
        "explanation": scan.get("explanation") or {
            "risk_factors": [],
            "feature_importance": [],
            "summary": "No explanation available."
        },
        "created_at": scan["created_at"],
    }


@router.get("/history/my", status_code=status.HTTP_200_OK)
async def get_my_scan_history(
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get user's scan history, paginated.
    """
    cursor = db.scans.find({"user_id": str(current_user["user_id"])}).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for s in cursor:
        items.append({
            "id": str(s["_id"]),
            "filename": s["filename"],
            "file_type": s.get("file_type"),
            "status": s.get("status", "completed"),
            "created_at": s["created_at"],
            "detection_result": s.get("detection_result"),
            "is_zero_day": s.get("is_zero_day", False),
        })
    return items


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Delete a scan and its uploaded file.
    """
    _id = to_oid(scan_id)
    scan = await db.scans.find_one({"_id": _id})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if str(scan["user_id"]) != str(current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this scan")

    # Delete file from disk
    file_path = os.path.join(settings.UPLOAD_DIR, str(scan["user_id"]), scan["filename"])
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"🗑️ Deleted file: {file_path}")
        except Exception as e:
            print(f"⚠️ Warning: Failed to delete file {file_path}: {e}")

    # Delete from database
    await db.scans.delete_one({"_id": _id})
    return None
