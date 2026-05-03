# Python test file with security vulnerabilities

import os
import subprocess
import pickle

# ==================== SECRETS ====================

# AWS Credentials
AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# API Keys
api_key = "sk_test_4eC39HqLyjWDarjtT1zdp7dc"
API_TOKEN = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"

# Database Password
db_password = "MySecurePassword123!"
DATABASE_URL = "postgresql://user:SecretPass123@localhost/mydb"

# JWT Token
auth_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzNDU2In0.abc123def456ghi789"

# ==================== DANGEROUS PATTERNS ====================

# eval() usage - dangerous!
def process_input(user_input):
    result = eval(user_input)  # Code injection risk
    return result

# exec() usage
def execute_code(code):
    exec(code)  # Very dangerous

# SQL Injection
def get_user(username):
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    return db.execute(query)

# Command injection via subprocess
def run_command(filename):
    subprocess.call("cat " + filename, shell=True)  # Dangerous!

# os.system with concatenation
def process_file(path):
    os.system("ls -la " + path)

# Unsafe deserialization
def load_data(data):
    return pickle.loads(data)  # Unsafe!

# SQL string building
def search_products(category):
    sql = "SELECT * FROM products WHERE "
    sql += "category = '" + category + "'"
    return execute_query(sql)

# ==================== DEV/STAGING URLS ====================

# Localhost
API_URL = "http://localhost:5000/api"
DEV_ENDPOINT = "https://localhost:8000/auth"

# Development URLs
dev_api = "https://api.dev.example.com/v1"
development_url = "http://dev.myapp.com/api"

# Staging URLs
staging_endpoint = "https://staging.example.com/api/v2"
stage_url = "http://stage.company.com/data"

# Test URLs
test_api = "https://test.example.com/api"

# Internal IPs
internal_service = "http://192.168.1.50:8080/api"
private_api = "https://10.0.0.100/admin"

# ==================== VALID CODE ====================

# These should NOT trigger (placeholders/examples)
example_password = "your_password_here"
test_key = "test_api_key_placeholder"

# Production URL (OK)
production_api = "https://api.production.com/v1"

print("Python test file loaded")

# Made with Bob
