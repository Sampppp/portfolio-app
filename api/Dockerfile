# minimal version of python that excludes unnecessary packages
FROM python:3.11-slim
# set working directory so all subsequent commands are run from here
WORKDIR /app
# copies over the requirements.txt and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# copy over remaining files: manage.py, /photos, /portfolio
COPY . .

# Collect static files (optional for admin later)
RUN python manage.py collectstatic --noinput || true
# default command to run when the container starts
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
