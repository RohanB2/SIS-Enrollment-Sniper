# test = requests.get("https://sisuva.admin.virginia.edu/psc/ihprd/UVSS/SA/s/WEBLIB_HCX_CM.H_CLASS_SEARCH.FieldFormula.IScript_ClassSearch?institution=UVA01&term=1228&subject=CS&page=1")

# Formula for term: 1 + [2 digit year] + [2 for spring, 8 for fall]
# Fall 2026 = term 1268

import requests
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from datetime import datetime

def ask_user():
    print("Formula for term: 1 + [2 digit year] + [2 for spring, 8 for fall]")
    
    # Gets info of the class they want to track
    term = input("What semester/term is the class you are trying to track: ")
    unique_section_nbr = input("Enter the unique 5 digit class number on SIS/Lou's List (e.g. 17020): ") 
        
    return term, unique_section_nbr

# Format: 
# First Line: Term (e.g. 1268 for Fall 2026)
# Second + following lines: 5 digit class number # Any comments from the user

def get_classes_from_files():
    with open('track.txt', 'r') as file:
        # Each line is an element in the content array.
        content = file.readlines()
        
        term = content[0].strip()  # First line is the term
        class_numbers = [line.strip() for line in content[1:]] # Remaining lines are class numbers
        
        # Removes the comments from the class_numbers elements. Leaves only the 5 digit class number.
        for i in range (len(class_numbers)):
            # Remove any non-digit characters (like comments) from the class number
            class_numbers[i] = class_numbers[i][0:5]
            
        print(class_numbers)  
        
    return term, class_numbers

def get_class_info(term, unique_section_nbr):
    url = f"https://sisuva.admin.virginia.edu/psc/ihprd/UVSS/SA/s/WEBLIB_HCX_CM.H_CLASS_SEARCH.FieldFormula.IScript_ClassSearch?institution=UVA01&term={term}&class_nbr={unique_section_nbr}"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json() 
        # print(data) # For debugging purposes, to see the full API response structure.
        
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
            
            # Gets the exact course title (Ex: Data Structures & Algo 2)
            desc = my_class.get('descr', '')
            
            # Extract Time
            meetings = my_class.get('meetings', [])
            if len(meetings) > 0:
                days = meetings[0].get('days', '')
                raw_start_time = meetings[0].get('start_time', '')
                raw_end_time = meetings[0].get('end_time', '')

            start_time, end_time = format_time(raw_start_time), format_time(raw_end_time)
            time = f"{days}: {start_time} - {end_time}"
            
            
            # 3. Extract Professor Name
            # The API usually stores instructors as a list of dictionaries. 
            # We safely check if the list exists and grab the first professor's name.
            instructors_list = my_class.get('instructors', [])
            if len(instructors_list) > 0:
                professor = instructors_list[0].get('name', 'TBA')
            else:
                professor = "TBA"

            # 4. Trigger Notification Condition
            if open_spots > 0:
                print(f"{course_name} with {professor} has {open_spots} open spot(s)! Enroll now!")
                
                # Pass all three variables to the send notification function
                
                # send_email_noti(course_name, desc, professor, open_spots, time)
                send_discord_noti(course_name, desc, professor, open_spots, time)
            else:
                print(f"Checked {course_name}. No spots open yet.")
            
        else:
            print("Class not found. Check your term and section number.")
    else:
        print("Failed to retrieve class information.")
        
def format_time(row_time_str):
    try:
        parsed_time = datetime.strptime(row_time_str, "%H.%M.%S.%f")
        
        # 12-hour clas with AM/PM (Ex: 09:30 AM)
        readable_time = parsed_time.strftime("%I:%M%p")
        
        if readable_time[0] == '0':  # Remove leading zero for hours
            readable_time = readable_time[1:]
            
        return readable_time
    
    except Exception as e:
        print(f"Error parsing time: {e}")
        return "TBA"
    
def send_discord_noti(course_name, descr, professor, open_spots, time):
    # Load keys
    load_dotenv('keys.env')
    webhook_url = os.getenv('discord_webhook_url')
    
    # The message/payload we want to send to Discord
    data = {
            # 'content' is the standard text outside the embed. 
            # Using @everyone here will physically ping your phone/desktop!
            "content": "@everyone SIS SPOT OPEN ALERT", 
            "embeds": [
                {
                    "title": f"Spots Open: {descr} - {course_name}",
                    "description": "Go to SIS immediately to enroll!",
                    "color": 16711680, # This is the decimal code for Red. (Green is 65280)
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
    
    # Send the POST request to the webhood URL.
    response = requests.post(webhook_url, json=data)
    
    # Discord returns a 204 status code for a successful request.
    if response.status_code == 204:
        print("Discord alert sent successfully!")
    else:
        print(f"Failed to send Discord alert. Error: {response.status_code}")

def send_email_noti(course_name, descr, professor, open_spots, time):
    # Loading keys & env variables.
    load_dotenv('keys.env')
    
    # Where the emails are going to come from.
    bot_email = os.getenv('sender_email')
    bot_password = os.getenv('app_password')
    
    # Who/what email is receiving the notification? 
    recipient_email = os.getenv('recipient_email')
    
    # Create the message using an f-string to inject the variables
    msg = EmailMessage()
    
    # Formatting the email body with line breaks (\n) for readability
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

    # Connect to Gmail and send
    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(bot_email, bot_password)
        server.send_message(msg)
        server.quit()
        print("Alert sent successfully!")
    except Exception as e:
        print(f"Failed to send email: {e}")


if __name__ == "__main__":
    # term, section_nbr = ask_user()
    
    # Gets all the class numbers that the user wants to track.
    term, class_numbers = get_classes_from_files()
    
    # Loops through all the classes the user wants to track, checks all of them and send's noti if any of them have an open spot.
 
    for section_nbr in class_numbers:
        get_class_info(term, section_nbr)
        
