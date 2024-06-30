import pandas as pd
import sqlite3

# Read the Excel file
df = pd.read_excel('db/table_data.xlsx')

# Connect to an SQLite database (or create it)
conn = sqlite3.connect('db/database.db')
cursor = conn.cursor()

# Create a table
create_table_query = '''
CREATE TABLE IF NOT EXISTS medicines (
    names_of_medicines TEXT,
    Generic_name TEXT,
    pregnancy_safety TEXT,
    sec_title TEXT,
    main_title TEXT,
    explanation_medicine TEXT
)
'''
cursor.execute(create_table_query)

# Insert data into the table
for index, row in df.iterrows():
    insert_query = '''
    INSERT INTO medicines (names_of_medicines, Generic_name, pregnancy_safety, sec_title, main_title, explanation_medicine)
    VALUES (?, ?, ?, ?, ?, ?)
    '''
    cursor.execute(insert_query, tuple(row))

# Commit the transaction and close the connection
conn.commit()
conn.close()
