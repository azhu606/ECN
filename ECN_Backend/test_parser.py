from services import parse_event, load_club_mapping, load_locations
import json

# Test dynamic loading
print("Testing dynamic data loading:")
clubs = load_club_mapping()
locations = load_locations()

print(f"Clubs loaded: {len(clubs)}")
print(f"Locations loaded: {len(locations)}")

print("\nAll loaded clubs:")
for club_name, club_id in clubs.items():
    print(f"  {club_name} -> {club_id}")



# Test cases
test_inputs = [
    "AI Society workshop on neural networks next Friday at 5pm in Goizueta, 90 minutes",
    "Blockchain Club meeting tomorrow at 3:30pm",
    "Algory Capital presentation today at 7pm for 2 hours",
    "Emory Data Science Club Python tutorial at White Hall 206"
]

print("\n" + "="*50)
print("Testing event parsing:")
for i, text in enumerate(test_inputs, 1):
    print(f"\nTest {i}: {text}")
    try:
        result = parse_event(text)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")