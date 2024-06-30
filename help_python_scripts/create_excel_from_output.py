import pandas as pd
from bs4 import BeautifulSoup

# Read the HTML file
with open('html/output.html', 'r') as file:
    html_content = file.read()

# Parse the HTML content using BeautifulSoup
soup = BeautifulSoup(html_content, 'html.parser')

# Find the table in the HTML
table = soup.find('table')

# Extract table headers
headers = [header.text for header in table.find_all('th')]

# Extract table rows
rows = []
for row in table.find_all('tr')[1:]:  # Skip the header row
    rows.append([cell.text for cell in row.find_all('td')])

# Create a DataFrame from the extracted data
df = pd.DataFrame(rows, columns=headers)

# Save the DataFrame to an Excel file
df.to_excel('db/table_data.xlsx', index=False)
