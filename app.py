from flask import Flask, send_from_directory, request, jsonify
import sqlite3

app = Flask(__name__, static_folder='static')

# Mapping for pregnancy safety categories
pregnancy_safety_map = {
    'A': 1,
    'B': 2,
    'C': 3,
    'D': 4,
    'X': 5,
    'N': 6  # Assuming 'N' means no information available
}

@app.route('/')
def home():
    return send_from_directory('html', 'index.html')

@app.route('/api/get_table_data')
def get_table_data():
    conn = sqlite3.connect('db/database.db')
    cursor = conn.cursor()
    cursor.execute("SELECT names_of_medicines, Generic_name, pregnancy_safety, sec_title, main_title, explanation_medicine FROM medicines")
    rows = cursor.fetchall()
    conn.close()

    headers = ['names_of_medicines', 'Generic_name', 'pregnancy_safety', 'sec_title', 'main_title', 'explanation_medicine']
    data = [dict(zip(headers, row)) for row in rows]

    return jsonify(data)

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '').lower()

    conn = sqlite3.connect('db/database.db')
    cursor = conn.cursor()

    if query:
        cursor.execute("""
            SELECT names_of_medicines, Generic_name, pregnancy_safety, sec_title, main_title, explanation_medicine
            FROM medicines
            WHERE LOWER(names_of_medicines) LIKE ?
        """, ('%' + query + '%',))
    else:
        cursor.execute("""
            SELECT names_of_medicines, Generic_name, pregnancy_safety, sec_title, main_title, explanation_medicine
            FROM medicines
        """)

    rows = cursor.fetchall()
    conn.close()

    headers = ['names_of_medicines', 'Generic_name', 'pregnancy_safety', 'sec_title', 'main_title', 'explanation_medicine']
    data = [dict(zip(headers, row)) for row in rows]

    return jsonify(data)

@app.route('/api/suggestions', methods=['POST'])
def suggestions():
    data = request.json
    sec_title = data.get('secTitle')
    pregnancy_safety = data.get('pregnancySafety')

    if not sec_title or not pregnancy_safety:
        return jsonify({"error": "Missing required parameters"}), 400

    try:
        pregnancy_safety_value = pregnancy_safety_map.get(pregnancy_safety, 6)  # Get the mapped value, default to 6 if not found
        conn = sqlite3.connect('db/database.db')
        cursor = conn.cursor()

        cursor.execute("""
            SELECT names_of_medicines, Generic_name, pregnancy_safety, sec_title, main_title, explanation_medicine
            FROM medicines
            WHERE sec_title = ? AND (
                CASE pregnancy_safety
                    WHEN 'A' THEN 1
                    WHEN 'B' THEN 2
                    WHEN 'C' THEN 3
                    WHEN 'D' THEN 4
                    WHEN 'X' THEN 5
                    ELSE 6
                END
            ) < ?
            ORDER BY (
                CASE pregnancy_safety
                    WHEN 'A' THEN 1
                    WHEN 'B' THEN 2
                    WHEN 'C' THEN 3
                    WHEN 'D' THEN 4
                    WHEN 'X' THEN 5
                    ELSE 6
                END
            )
        """, (sec_title, pregnancy_safety_value))

        rows = cursor.fetchall()
        conn.close()

        headers = ['names_of_medicines', 'Generic_name', 'pregnancy_safety', 'sec_title', 'main_title', 'explanation_medicine']
        data = [dict(zip(headers, row)) for row in rows]

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('js', filename)

if __name__ == '__main__':
    app.run(debug=True)
