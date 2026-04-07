# test = requests.get("https://sisuva.admin.virginia.edu/psc/ihprd/UVSS/SA/s/WEBLIB_HCX_CM.H_CLASS_SEARCH.FieldFormula.IScript_ClassSearch?institution=UVA01&term=1228&subject=CS&page=1")

# Formula for term: 1 + [2 digit year] + [2 for spring, 8 for fall]
# Fall 2026 = term 1268

import requests
import json
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

def ask_user():
    print("Formula for term: 1 + [2 digit year] + [2 for spring, 8 for fall]")
    
    # Gets info of the class they want to track
    term = input("What semester/term is the class you are trying to track: ")
    unique_section_nbr = input("Enter the unique 5 digit class number on SIS/Lou's List (e.g. 17020): ") 
        
    return term, unique_section_nbr


def get_class_info(term, unique_section_nbr):
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
            
            # 2. Extract Class Name (e.g., "CS 3100")
            subject = my_class.get('subject', 'Unknown Subject')
            catalog_nbr = my_class.get('catalog_nbr', '')
            course_name = f"{subject} {catalog_nbr}"
            
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
                # Pass all three variables to our updated email function
                send_noti(course_name, professor, open_spots)
            else:
                print(f"Checked {course_name}. No spots open yet.")
            
        else:
            print("Class not found. Check your term and section number.")
    else:
        print("Failed to retrieve class information.")
    

def send_noti(course_name, professor, open_spots):
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
        f"Course: {course_name}\n"
        f"Professor: {professor}\n"
        f"Spots Available: {open_spots}\n\n"
        f"Go to SIS immediately to enroll!"
    )
    
    msg.set_content(email_body)
    msg['Subject'] = f"Open Spot: {course_name}"
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
    term, section_nbr = ask_user()
    get_class_info(term, section_nbr)