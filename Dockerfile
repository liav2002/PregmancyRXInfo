# Use the official Python image from the Docker Hub
FROM python:3.9-slim

# Set environment variables to ensure that Python outputs everything to the console
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file to the working directory
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the working directory contents into the container at /app
COPY . .

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define the command to run the Flask app
CMD ["python", "app.py"]

