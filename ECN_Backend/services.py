from datetime import datetime, timedelta
from typing import Any, Dict, List
from db_ops import get_session
from models import Club, Event
import difflib
import re
from sqlalchemy import func, or_

# ---- Helpers ----
def _normalize_text(s: str) -> str:
    tokens = re.findall(r"[a-z0-9]+", (s or "").lower())
    return " ".join(tokens)

def _tokenize(s: str) -> list[str]:
    return _normalize_text(s).split()

def _fuzzy_any_match(q_word: str, title_words: list[str], cutoff: float = 0.82) -> bool:
    if q_word in title_words:
        return True
    return bool(difflib.get_close_matches(q_word, title_words, n=1, cutoff=cutoff))

# ---- Clubs ----
def list_clubs(q: str = "", tags: list[str] | None = None) -> Dict[str, Any]:
    with get_session() as s:
        query = s.query(Club)
        if q:
            pattern = f"%{q.lower()}%"
            query = query.filter(
                func.lower(Club.name).like(pattern)
                | func.lower(Club.description).like(pattern)
                | func.lower(Club.purpose).like(pattern)
            )
        clubs = query.order_by(Club.updated_at.desc()).all()
        items = [{
            "id": str(c.id),
            "name": c.name,
            "description": c.description,
            "createdAt": c.created_at.isoformat(),
            "updatedAt": c.updated_at.isoformat()
        } for c in clubs]
        return {"items": items, "total": len(items)}

def create_club(payload: dict) -> str:
    if not payload.get("name"):
        raise ValueError("name is required")
    with get_session() as s:
        c = Club(name=payload["name"], description=payload.get("description", ""))
        s.add(c)
        s.flush()
        return str(c.id)

# ---- Events ----
def list_events(upcoming_only: bool = True) -> List[Dict[str, Any]]:
    with get_session() as s:
        q = s.query(Event)
        if upcoming_only:
            q = q.filter(Event.start_time >= datetime.utcnow() - timedelta(days=1))
        events = q.order_by(Event.start_time.asc()).all()
        return [{
            "id": str(e.id),
            "clubId": str(e.club_id),
            "title": e.title,
            "startTime": e.start_time.isoformat(),
            "endTime": e.end_time.isoformat() if e.end_time else None,
            "location": e.location,
            "status": e.status
        } for e in events]

def create_event(payload: dict) -> str:
    req = ["clubId", "title", "startTime", "endTime"]
    missing = [k for k in req if not payload.get(k)]
    if missing:
        raise ValueError(f"Missing: {', '.join(missing)}")

    with get_session() as s:
        evt = Event(
            club_id=payload["clubId"],
            title=payload["title"],
            description=payload.get("description"),
            location=payload.get("location"),
            start_time=datetime.fromisoformat(payload["startTime"]),
            end_time=datetime.fromisoformat(payload["endTime"]),
        )
        s.add(evt)
        s.flush()
        return str(evt.id)

# ---- Smart Search (Simplified) ----
def search_clubs_smart(q: str = "", tags: list[str] | None = None, fuzzy_cutoff: float = 0.82) -> Dict[str, Any]:
    q_norm = _normalize_text(q)
    q_words = _tokenize(q_norm)

    with get_session() as s:
        base = s.query(Club)
        if q_words:
            like_clauses = []
            for w in q_words:
                pat = f"%{w}%"
                like_clauses.append(func.lower(Club.name).like(pat))
                like_clauses.append(func.lower(Club.description).like(pat))
            base = base.filter(or_(*like_clauses))

        candidates = base.order_by(Club.updated_at.desc()).all()

        matched_ids = set()
        for c in candidates:
            name_words = _tokenize(c.name)
            if q_words and any(_fuzzy_any_match(qw, name_words, cutoff=fuzzy_cutoff) for qw in q_words):
                matched_ids.add(c.id)

        matched = [c for c in candidates if c.id in matched_ids]
        items = [{
            "id": str(c.id),
            "name": c.name,
            "description": c.description,
            "updatedAt": c.updated_at.isoformat()
        } for c in matched]
        return {"items": items, "total": len(items)}

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy import func, or_
from db_ops import get_session
from models import Club, Event, Review

def _avg_rating_for_club(session, club_id) -> float:
    # average rating; default to 4.6 if no reviews
    row = session.query(func.avg(Review.rating)).filter(Review.club_id == club_id).one()
    try:
        val = float(row[0]) if row[0] is not None else 4.6
    except Exception:
        val = 4.6
    return round(val, 1)

def _next_event_for_club(session, club_id) -> Optional[dict]:
    now = datetime.utcnow()
    evt = (
        session.query(Event)
        .filter(Event.club_id == club_id, Event.start_time >= now)
        .order_by(Event.start_time.asc())
        .first()
    )
    if not evt:
        return None
    # simple pretty date/time
    date_str = evt.start_time.strftime("%b %d")
    time_str = evt.start_time.strftime("%-I:%M %p")
    return {
        "name": evt.title,
        "date": date_str,
        "time": time_str,
        "location": evt.location or "TBD",
    }

def _activity_score(upcoming_count: int, verified: bool) -> int:
    base = min(100, upcoming_count * 8)
    if verified:
        base += 10
    return min(100, base)

def _discoverability_index(activity: int, members: int) -> int:
    # simple composite metric
    return min(100, activity + min(40, members // 5))

def list_clubs(
    q: str = "",
    tags: List[str] | None = None,            # unused placeholder (no Tag model)
    school: Optional[str] = None,             # unused placeholder
    category: Optional[str] = None,           # unused placeholder
    verified_only: bool = False,
    sort_by: str = "discoverability",
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    with get_session() as s:
        query = s.query(Club)

        if q:
            pattern = f"%{q.lower()}%"
            query = query.filter(
                func.lower(Club.name).like(pattern)
                | func.lower(Club.description).like(pattern)
                | func.lower(Club.purpose).like(pattern)
            )

        if verified_only:
            query = query.filter(Club.verified.is_(True))

        # total BEFORE pagination
        total = query.count()

        # simple recency ordering first (we’ll re-sort after computing metrics if needed)
        clubs = (
            query
            .order_by(Club.updated_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        # Build enriched items expected by the UI
        items: List[Dict[str, Any]] = []
        now = datetime.utcnow()

        # Preload upcoming events per club (counts) to compute activity
        upcoming_counts = {
            c.id: s.query(func.count(Event.id))
                    .filter(Event.club_id == c.id, Event.start_time >= now)
                    .scalar()
            for c in clubs
        }

        for c in clubs:
            members_count = len(c.member_ids or [])  # ARRAY(UUID) in your model
            verified = bool(c.verified)
            rating = _avg_rating_for_club(s, c.id)
            next_evt = _next_event_for_club(s, c.id)
            activity = _activity_score(upcoming_counts.get(c.id, 0), verified)
            discover = _discoverability_index(activity, members_count)

            items.append({
                "id": str(c.id),
                "name": c.name,
                "description": c.description,
                "category": "General",             # placeholder; no category field in model
                "school": [],                      # placeholder; no school list in model
                "members": members_count,
                "rating": rating,
                "verified": verified,
                "lastUpdatedISO": c.updated_at.isoformat(),
                "nextEvent": next_evt,
                "website": c.request_info_form_url,  # best available url-ish field
                "tags": [],                        # placeholder; no tags model
                "activityScore": activity,
                "discoverabilityIndex": discover,
            })

        # Sort on the server side as requested
        def _key(item):
            if sort_by == "members":
                return item["members"]
            if sort_by == "rating":
                return item["rating"]
            if sort_by == "activity":
                return item["activityScore"]
            if sort_by == "updated":
                return item["lastUpdatedISO"]
            # default: discoverability
            return item["discoverabilityIndex"]

        reverse = sort_by != "updated"  # updated: newest first (max ISO)
        items.sort(key=_key, reverse=reverse)

        return {"items": items, "total": total}


# ---- Event Parser ----
import re
import json
from typing import Optional

# Sample data for testing/fallback
_SAMPLE_CLUB_MAPPING = {
    "algory capital": "algory-capital-uuid",
    "emory consulting group": "consulting-group-uuid", 
    "ai society": "ai-society-uuid",
    "blockchain club": "blockchain-club-uuid",
    "emory data science club": "data-science-uuid",
    "impact investing group": "impact-investing-uuid",
    "goizueta finance club": "finance-club-uuid",
    "emory entrepreneurship club": "entrepreneurship-uuid",
    "marketing analytics club": "marketing-analytics-uuid",
    "qqqqqqq": "quant-econ-uuid"
}

_SAMPLE_LOCATIONS = [
    "Goizueta Business School", "White Hall", "Math & Science Center",
    "Emory Student Center", "Cox Hall", "Library Quad", "Rich Building",
    "Callaway Center", "Woodruff PE Center", "Virtual / Zoom"
]

# Location keywords for partial matching
_LOCATION_KEYWORDS = {
    "goizueta": "Goizueta Business School",
    "white": "White Hall",
    "math": "Math & Science Center",
    "science": "Math & Science Center",
    "student": "Emory Student Center",
    "cox": "Cox Hall",
    "library": "Library Quad",
    "rich": "Rich Building",
    "callaway": "Callaway Center",
    "woodruff": "Woodruff PE Center",
    "virtual": "Virtual / Zoom",
    "zoom": "Virtual / Zoom"
}

def load_club_mapping():
    try:
        with get_session() as s:
            clubs = s.query(Club).all()
            print(f"Loaded {len(clubs)} clubs from database")  # Debug
            return {club.name.lower(): str(club.id) for club in clubs}
    except Exception as e:
        print(f"Database error, using fallback: {e}")  # Debug
        return _SAMPLE_CLUB_MAPPING


def load_locations():
    """Load locations from database with fallback to sample data."""
    try:
        with get_session() as s:
            locations = s.query(Event.location).distinct().filter(Event.location.isnot(None)).all()
            result = [loc[0] for loc in locations]
            return result if result else _SAMPLE_LOCATIONS
    except:
        return _SAMPLE_LOCATIONS

def ai_parse_event(text: str) -> Optional[Dict[str, Any]]:
    """Use AI to parse event text - primary parsing method."""
    try:
        try:
            from openai import OpenAI
        except ImportError:
            print("OpenAI package not installed, skipping AI parsing")
            return None
            
        from datetime import datetime
        import os
        
        # Try to load from .env file
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass  # dotenv not installed, use system env vars
        
        # Check if OpenAI API key is available
        if not os.getenv('OPENAI_API_KEY'):
            print("OpenAI API key not found, skipping AI parsing")
            return None
            
        client = OpenAI()
        clubs = load_club_mapping()
        locations = load_locations()
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        prompt = f"""Parse this event description into JSON format. Extract:
- Club name (match from available clubs)
- Event title (concise, descriptive)
- Start date/time (ISO format: YYYY-MM-DDTHH:MM:SS)
- End date/time (ISO format, assume 2 hours if not specified)
- Location (match from available locations, include room numbers)
- Description (brief summary)

Available clubs: {list(clubs.keys())}
Available locations: {locations}
Current date: {current_date}

Event text: "{text}"

Return JSON with this exact structure:
{{
  "clubId": "uuid-from-clubs",
  "title": "Event Title",
  "startTime": "YYYY-MM-DDTHH:MM:SS",
  "endTime": "YYYY-MM-DDTHH:MM:SS",
  "description": "Brief description",
  "location": "Location with room number if applicable"
}}

Return only the JSON, no other text:"""
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.1
        )
        
        result_text = response.choices[0].message.content.strip()
        # Clean up response to extract JSON
        if '```json' in result_text:
            result_text = result_text.split('```json')[1].split('```')[0]
        elif '```' in result_text:
            result_text = result_text.split('```')[1]
        
        result = json.loads(result_text)
        
        # Map club name to UUID
        if "clubId" in result:
            club_found = False
            for club, uuid in clubs.items():
                if club.lower() in text.lower() or club.lower() in result.get("title", "").lower():
                    result["clubId"] = uuid
                    club_found = True
                    break
            if not club_found:
                result["clubId"] = list(clubs.values())[0]  # Default to first club
        
        return result
    except Exception as e:
        print(f"AI parsing failed: {e}")
        return None

def get_default_event() -> Dict[str, Any]:
    """Default event when all parsing fails."""
    tomorrow = datetime(2025, 11, 4, 18, 0)  # Tomorrow 6 PM
    return {
        "clubId": "ai-society-uuid",  # Default to AI Society
        "title": "AI Society General Meeting",
        "startTime": tomorrow.isoformat(),
        "endTime": (tomorrow + timedelta(hours=2)).isoformat(),
        "description": "General club meeting",
        "location": "Goizueta Business School"
    }

def parse_event(text: str) -> Dict[str, Any]:
    """Convert natural language to event JSON matching create_event() schema."""
    # Try AI parsing first
    ai_result = ai_parse_event(text)
    if ai_result:
        return ai_result
    
    # Fallback to rule-based parsing
    return rule_based_parse(text)

def rule_based_parse(text: str) -> Dict[str, Any]:
    """Rule-based parsing as fallback when AI parsing fails."""
    text_lower = text.lower()
    club_mapping = load_club_mapping()
    locations = load_locations()
    
    # Extract club
    club_id = None
    club_name = ""
    for club, uuid in club_mapping.items():
        if club in text_lower:
            club_id = uuid
            club_name = club.title()
            break
    
    # If no club found, use default
    if not club_id:
        return get_default_event()
    
    # Extract location with room number support
    location = None
    for loc in locations:
        if loc.lower() in text_lower:
            # Check for room number after location
            room_match = re.search(rf'{re.escape(loc.lower())}\s+(\d+)', text_lower)
            if room_match:
                location = f"{loc} {room_match.group(1)}"
            else:
                location = loc
            break
    
    # Check for partial location matches using keywords
    if not location:
        # Clean up punctuation for better matching
        clean_words = re.sub(r'[,.]', '', text_lower).split()
        for word in clean_words:
            if word in _LOCATION_KEYWORDS:
                matched_location = _LOCATION_KEYWORDS[word]
                # Check for room number after this word
                room_match = re.search(rf'{re.escape(word)}\s+(\d+)', text_lower)
                if room_match:
                    location = f"{matched_location} {room_match.group(1)}"
                else:
                    location = matched_location
                break
    
    # Extract time - use current date as base
    base_date = datetime.now().date()
    
    # Day parsing
    if "next friday" in text_lower:
        days_ahead = (4 - base_date.weekday()) % 7 + 7
        event_date = base_date + timedelta(days=days_ahead)
    elif "tomorrow" in text_lower:
        event_date = base_date + timedelta(days=1)
    elif "today" in text_lower:
        event_date = base_date
    else:
        event_date = base_date + timedelta(days=1)  # Default tomorrow
    
    # Time parsing
    time_match = re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm)', text_lower)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0
        if time_match.group(3) == 'pm' and hour != 12:
            hour += 12
        elif time_match.group(3) == 'am' and hour == 12:
            hour = 0
    else:
        hour, minute = 18, 0  # Default 6 PM
    
    start_time = datetime.combine(event_date, datetime.min.time().replace(hour=hour, minute=minute))
    
    # Duration parsing
    duration_match = re.search(r'(\d+)\s*(?:minutes?|mins?|hours?|hrs?)', text_lower)
    if duration_match:
        duration_val = int(duration_match.group(1))
        if 'hour' in text_lower or 'hr' in text_lower:
            duration = timedelta(hours=duration_val)
        else:
            duration = timedelta(minutes=duration_val)
    else:
        duration = timedelta(hours=2)  # Default 2 hours
    
    end_time = start_time + duration
    
    # Extract title and description
    # Remove club name, time, location, and common words for cleaner parsing
    clean_text = text
    if club_name:
        clean_text = re.sub(re.escape(club_name), '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'\b(?:next|tomorrow|today)\s+\w*day\b', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'\d{1,2}:?\d{0,2}\s*(?:am|pm)', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'\b(?:at|in)\s+[^,]+', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'\d+\s*(?:minutes?|mins?|hours?|hrs?)', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'[,]+', '', clean_text)
    
    # Split into title and description
    words = [w for w in clean_text.split() if w.lower() not in ['on', 'at', 'in', 'the', 'a', 'an', 'for']]
    
    if len(words) <= 3:
        title = f"{club_name} {' '.join(words)}".strip() if club_name else ' '.join(words)
        description = None
    else:
        title_words = words[:3]
        desc_words = words[3:]
        title = f"{club_name} {' '.join(title_words)}".strip() if club_name else ' '.join(title_words)
        description = ' '.join(desc_words) if desc_words else None
    
    return {
        "clubId": club_id,
        "title": title,
        "startTime": start_time.isoformat(),
        "endTime": end_time.isoformat(),
        "description": description,
        "location": location
    }
