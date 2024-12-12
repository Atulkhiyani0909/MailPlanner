# Email Scheduling and Tracking System

This is a web-based **Email Scheduling and Tracking System** that enables users to send bulk emails, schedule them for future delivery, and track their status in real-time. The system is built with **Node.js** and uses a simple yet powerful dashboard to manage contacts, schedule emails, and monitor email performance.

## Key Features

- **Bulk Email Sending**: Upload contact lists and send emails to multiple recipients simultaneously.
- **Email Scheduling**: Schedule emails to be sent at a specific future date and time.
- **Real-Time Email Tracking**: Monitor the status of sent emails, including delivery status and open rates.
- **Automated Sending**: Automatically sends scheduled emails using cron jobs.
- **Email Templates**: Reuse and customize email templates for efficient campaign management.

## Technologies Used

- **Backend**: 
  - **Node.js** with **Express.js**: A JavaScript runtime and web framework for building the server-side of the application.
- **Database**: 
  - **MongoDB**: A NoSQL database to store email templates, contacts, and scheduled email data.
- **Email Sending**: 
  - **Nodemailer**: A Node.js library used to send emails through SMTP servers.
- **Task Scheduling**: 
  - **Cron Jobs**: A time-based job scheduler used for automating the email sending process.

## Setup & Installation

### Prerequisites

- **Node.js**: Ensure you have Node.js installed on your machine.
- **MongoDB**: You’ll need access to a MongoDB database.
- **SMTP Server**: Configure an SMTP server (such as Gmail) to send the emails.

### Installation Steps

1. **Clone this repository**:
   ```bash
   https://github.com/Atulkhiyani0909/MailPlanner.git
