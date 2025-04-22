# Pinecone - Desktop Photo Organization System
## Overview
Pinecone is a desktop app built with Electron that allows users to select a local folder of images and videos, view them as thumbnails and conviniently search through their collection. Internally it utilizes an Express server to scan the folder, populate an in-memory SQLite database, and server both original resolution files and 200x200 thumbnails. 

## Installation
Download the latest Windows installed from the Releases page:  
[Download Pinecone for Windows](https://github.com/galen-f/pinecone/releases/download/v1.0.0/pinecone-1.0.0.Setup.exe)

The app will be installed to the "C:\Users\\%user%\AppData\Local\pinecone" folder. *(AppData may be a hidden folder for you)*

## Usage
**1. Select a folder**  
Click the "select Folder" button.  
Choose any directory containing images (.jpg, .png, .gif, etc) or videos (.mp4, .mov).  

**2. Browse!**  
Scroll through the app and select pictures to view them at their original resolution.

## Demo
![pinecone-demo](https://github.com/user-attachments/assets/dce7f471-abef-48cd-bfff-8a044b75917f)

## Technolgies Used
**JavaScript** - Fetching data, managing state, and handling UI interactions  
**Node.js & Express** - REST API for backend folder scanning, database operations, and media serving.  
**Electron** - Desktop shell with Node.js integration not native dialogs and IPC.  
**SQLite** - In-memory database for registering and querying media metadata.  
**Sharp and FFMPEG** - Thumbnail Generation  

## Background
This project was initially designed during my internship at Granite Associates. A client organization was looking for a cheap alternative to expensive web-based photo organization systems. They had roughly 2 TB of photos on a shared hard-drive they needed to be able to search and organize. They tasked me with building this system.  
  
The first prototype was designed using a Python Flask API and some basic JavaScript, with a very heavy SQL database. When I returned to this project, about two years later, looking to add it to my portfolio, I switched this to use a much lighter system, with an Express API instead of Flask, and relying on JavaScript much more. The database was switched to in-memory SQL. This of course meant no real persistence, but lowered the memory costs so it would be more accesible to individuals. The system could be easily returned to a persistence library by switching to normal SQLite, this would allow you to add tags and other organization ssystems. Additionally, rather than a web-app hosted on the company servers, the Electron was used to turn the system into a desktop app.  

## License
This project is licenses under the Apache 2.0 License - see [LICENSE](LICENSE) for details
