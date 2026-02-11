from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId

from app.models.scan import ScanStats
from app.utils.database import get_database
from app.utils.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/stats", response_model=ScanStats)
async def get_scan_stats(
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """Get overall scan statistics"""
    # Get total scans
    total_scans = await db.scans.count_documents({})
    
    # Get malicious count
    malicious_count = await db.scans.count_documents({
        "detection_result": "malicious"
    })
    
    # Get benign count
    benign_count = await db.scans.count_documents({
        "detection_result": "benign"
    })
    
    # Get suspicious count
    suspicious_count = await db.scans.count_documents({
        "detection_result": "suspicious"
    })
    
    # Get zero-day count
    zero_day_count = await db.scans.count_documents({
        "is_zero_day": True
    })
    
    # Calculate average confidence
    pipeline = [
        {
            "$match": {
                "confidence_score": {"$exists": True, "$ne": None}
            }
        },
        {
            "$group": {
                "_id": None,
                "avg_confidence": {"$avg": "$confidence_score"}
            }
        }
    ]
    
    result = await db.scans.aggregate(pipeline).to_list(length=1)
    avg_confidence = result[0]["avg_confidence"] if result else 0.0
    
    # Calculate success rate
    failed_count = await db.scans.count_documents({
        "status": "failed"
    })
    success_rate = ((total_scans - failed_count) / total_scans * 100) if total_scans > 0 else 100.0
    
    return ScanStats(
        total_scans=total_scans,
        malicious_count=malicious_count,
        benign_count=benign_count,
        suspicious_count=suspicious_count,
        zero_day_count=zero_day_count,
        avg_confidence=round(avg_confidence, 2),
        success_rate=round(success_rate, 2)
    )

@router.get("/trends")
async def get_scan_trends(
    days: int = 30,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """Get scan trends over time"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": {
                    "date": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$created_at"
                        }
                    },
                    "result": "$detection_result"
                },
                "count": {"$sum": 1}
            }
        },
        {
            "$sort": {"_id.date": 1}
        }
    ]
    
    trends = await db.scans.aggregate(pipeline).to_list(length=None)
    
    # Format trends
    formatted_trends = {}
    for trend in trends:
        date = trend["_id"]["date"]
        result = trend["_id"]["result"]
        count = trend["count"]
        
        if date not in formatted_trends:
            formatted_trends[date] = {}
        formatted_trends[date][result] = count
    
    return formatted_trends

@router.get("/users")
async def get_user_stats(
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """Get user statistics"""
    # Get total users
    total_users = await db.users.count_documents({})
    
    # Get users by role
    admin_count = await db.users.count_documents({"role": "admin"})
    user_count = await db.users.count_documents({"role": "user"})
    
    # Get recent users
    recent_users = await db.users.find(
        {}
    ).sort("created_at", -1).limit(10).to_list(length=10)
    
    # Format recent users
    formatted_users = [
        {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user["created_at"]
        }
        for user in recent_users
    ]
    
    return {
        "total_users": total_users,
        "admin_count": admin_count,
        "user_count": user_count,
        "recent_users": formatted_users
    }

@router.get("/top-malware")
async def get_top_malware(
    limit: int = 10,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """Get top detected malware files"""
    pipeline = [
        {
            "$match": {
                "detection_result": "malicious"
            }
        },
        {
            "$group": {
                "_id": "$filename",
                "count": {"$sum": 1},
                "avg_confidence": {"$avg": "$confidence_score"}
            }
        },
        {
            "$sort": {"count": -1}
        },
        {
            "$limit": limit
        }
    ]
    
    top_malware = await db.scans.aggregate(pipeline).to_list(length=limit)
    
    return [
        {
            "filename": malware["_id"],
            "count": malware["count"],
            "avg_confidence": round(malware["avg_confidence"], 2)
        }
        for malware in top_malware
    ]

@router.get("/recent-scans")
async def get_recent_scans(
    limit: int = 20,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """Get recent scans across all users"""
    scans = await db.scans.find(
        {}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    formatted_scans = []
    for scan in scans:
        user = await db.users.find_one({"_id": scan["user_id"]})
        formatted_scans.append({
            "id": str(scan["_id"]),
            "filename": scan["filename"],
            "file_type": scan["file_type"],
            "status": scan["status"],
            "detection_result": scan.get("detection_result"),
            "confidence_score": scan.get("confidence_score"),
            "user": user["username"] if user else "Unknown",
            "created_at": scan["created_at"]
        })
    
    return formatted_scans

@router.get("/my-stats")
async def get_my_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get current user's personal statistics"""
    user_id = current_user["user_id"]
    
    # Get user's total scans
    total_scans = await db.scans.count_documents({"user_id": user_id})
    
    # Get user's malicious count
    malicious_count = await db.scans.count_documents({
        "user_id": user_id,
        "detection_result": "malicious"
    })
    
    # Get user's benign count
    benign_count = await db.scans.count_documents({
        "user_id": user_id,
        "detection_result": "benign"
    })
    
    # Get user's zero-day count
    zero_day_count = await db.scans.count_documents({
        "user_id": user_id,
        "is_zero_day": True
    })
    
    # Calculate average confidence
    pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "confidence_score": {"$exists": True, "$ne": None}
            }
        },
        {
            "$group": {
                "_id": None,
                "avg_confidence": {"$avg": "$confidence_score"}
            }
        }
    ]
    
    result = await db.scans.aggregate(pipeline).to_list(length=1)
    avg_confidence = result[0]["avg_confidence"] if result else 0.0
    
    return {
        "total_scans": total_scans,
        "malicious_count": malicious_count,
        "benign_count": benign_count,
        "zero_day_count": zero_day_count,
        "avg_confidence": round(avg_confidence, 2)
    }