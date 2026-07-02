import requests
import os
import smtplib
import json
from email.message import EmailMessage
from dotenv import load_dotenv
from datetime import datetime

def ask_user():
    print("Formula for term: 1 + [2 digit year] + [2 for spring, 8 for fall]")
    
    # Gets info of the class they want to track
    term = input("What semester/term is the class you are trying to track: ")
    unique_section_nbr = input("Enter the unique 5 digit class number on SIS/Lou's List (e.g. 17020): ") 
        
    return term, unique_section_nbr

def get_classes_from_firestore():
    api_key = os.getenv('FIREBASE_API_KEY')
    url = f"https://firestore.googleapis.com/v1/projects/sis-course-sniper-bot/databases/(default)/documents/data/tracker?key={api_key}"
    
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Error fetching from Firestore: {response.text}")
            return "", []
            
        doc = response.json()
        if "fields" not in doc:
            return "", []
            
        term = doc["fields"].get("term", {}).get("stringValue", "")
        courses_arr = doc["fields"].get("courses", {}).get("arrayValue", {}).get("values", [])
        
        courses = []
        for c in courses_arr:
            fields = c.get("mapValue", {}).get("fields", {})
            courses.append({
                "classNumber": fields.get("classNumber", {}).get("stringValue", ""),
                "title": fields.get("title", {}).get("stringValue", ""),
                "notes": fields.get("notes", {}).get("stringValue", ""),
                "time": fields.get("time", {}).get("stringValue", ""),
                "notifyType": fields.get("notifyType", {}).get("stringValue", ""),
                "notifyTarget": fields.get("notifyTarget", {}).get("stringValue", "")
            })
            
        return term, courses
    except Exception as e:
        print(f"Error reading from Firestore: {e}")
        return "", []

def get_class_info(term, course_obj):
    unique_section_nbr = course_obj.get('classNumber')
    notify_type = course_obj.get('notifyType')
    notify_target = course_obj.get('notifyTarget')

    url = f"https://sisuva.admin.virginia.edu/psc/ihprd/UVSS/SA/s/WEBLIB_HCX_CM.H_CLASS_SEARCH.FieldFormula.IScript_ClassSearch?institution=UVA01&term={term}&class_nbr={unique_section_nbr}"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json() 
        
        if len(data.get('classes', [])) > 0:
            my_class = data['classes'][0]
            
            # 1. Math for open spots
            class_capacity = my_class.get('class_capacity', 0)
            enrollment_total = my_class.get('enrollment_total', 0)
            open_spots = class_capacity - enrollment_total
            
            # 2. Extract Class Name and other attributes to pass into notifications.
            subject = my_class.get('subject', 'Unknown Subject')
            catalog_nbr = my_class.get('catalog_nbr', '')
            course_name = f"{subject} {catalog_nbr}"
            
            # Gets the exact course title
            desc = my_class.get('descr', '')
            
            # Extract Time
            meetings = my_class.get('meetings', [])
            if len(meetings) > 0:
                days = meetings[0].get('days', '')
                raw_start_time = meetings[0].get('start_time', '')
                raw_end_time = meetings[0].get('end_time', '')
            else:
                days = ''
                raw_start_time = ''
                raw_end_time = ''

            start_time, end_time = format_time(raw_start_time), format_time(raw_end_time)
            time = f"{days}: {start_time} - {end_time}"
            
            # 3. Extract Professor Name
            instructors_list = my_class.get('instructors', [])
            if len(instructors_list) > 0:
                professor = instructors_list[0].get('name', 'TBA')
            else:
                professor = "TBA"

            # 4. Trigger Notification Condition
            if open_spots > 0:
                print(f"{course_name} with {professor} has {open_spots} open spot(s)! Enroll now!")
                
                if notify_type == 'discord':
                    send_discord_noti(course_name, desc, professor, open_spots, time, notify_target)
                elif notify_type == 'email':
                    send_email_noti(course_name, desc, professor, open_spots, time, notify_target)
            else:
                print(f"Checked {course_name}. No spots open yet.")
            
        else:
            print(f"Class {unique_section_nbr} not found. Check your term and section number.")
    else:
        print(f"Failed to retrieve class information for {unique_section_nbr}.")
        
def format_time(row_time_str):
    if not row_time_str:
        return "TBA"
    try:
        parsed_time = datetime.strptime(row_time_str, "%H.%M.%S.%f")
        readable_time = parsed_time.strftime("%I:%M%p")
        if readable_time[0] == '0':  
            readable_time = readable_time[1:]
        return readable_time
    except Exception as e:
        print(f"Error parsing time: {e}")
        return "TBA"
    
def send_discord_noti(course_name, descr, professor, open_spots, time, webhook_url):
    data = {
            "content": "@everyone SIS SPOT OPEN ALERT", 
            "embeds": [
                {
                    "title": f"Spots Open: {descr} - {course_name}",
                    "description": "Go to SIS immediately to enroll!",
                    "color": 16711680, 
                    "fields": [
                        {"name": "Course", "value": course_name, "inline": False},
                        {"name": "Course Name", "value": descr, "inline": False},
                        {"name": "Professor", "value": professor, "inline": False},
                        {"name": "Time", "value": time, "inline": False},
                        {"name": "Open Spots", "value": str(open_spots), "inline": False}
                    ],
                    "footer": {"text": "UVA SIS Course Sniper"}
                }
            ]
        }
    
    try:
        response = requests.post(webhook_url, json=data)
        if response.status_code == 204:
            print(f"Discord alert sent successfully to {webhook_url}!")
        else:
            print(f"Failed to send Discord alert. Error: {response.status_code}")
    except Exception as e:
        print(f"Failed to send Discord alert: {e}")

def send_email_noti(course_name, descr, professor, open_spots, time, recipient_email):
    load_dotenv('keys.env')
    
    bot_email = os.getenv('sender_email')
    bot_password = os.getenv('app_password')
    
    msg = EmailMessage()
    email_body = (
        f"🚨 SPOT OPEN ALERT 🚨\n\n"
        f"Course: {descr} - {course_name}\n"
        f"Professor: {professor}\n"
        f"Time: {time}\n"
        f"Spots Available: {open_spots}\n\n"
        f"Go to SIS immediately to enroll!"
    )
    
    msg.set_content(email_body)
    msg['Subject'] = f"Open Spot: {descr} - {course_name}"
    msg['From'] = bot_email
    msg['To'] = recipient_email

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(bot_email, bot_password)
        server.send_message(msg)
        server.quit()
        print(f"Email alert sent successfully to {recipient_email}!")
    except Exception as e:
        print(f"Failed to send email to {recipient_email}: {e}")

if __name__ == "__main__":
    load_dotenv('keys.env')
    term, courses = get_classes_from_firestore()
    
    for course_obj in courses:
        get_class_info(term, course_obj)
