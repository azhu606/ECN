whats up team.
in case u need a refresher:
1. To run the frontend locally, first clone the repo by doing: git clone https://github.com/azhu606/ECN
2. then cd into the folder, wherever u put it
3. then cd into ECN_Frontend
4. then do npm i
5. then npm run dev

REMINDER: this is only for frontend

it should be working


Backend: 
Have postgres on your system and Pgamdin or DBeaver

create server group for ECN, 
create server on 170.0.0.1 // localhost 
port 5432 

in Dbeaver or Pgadmin, inside the server run using the query tool: CREATE DATABASE ecn;

in terminal cd into ECN_Backend 
source .venv/bin/activate
python db_ops.create
python -c "from seed_data import seed_data; seed_data()"
python app.py

TO check if it works in browser enter 
http://127.0.0.1:5000/api/health 

it should ok:'true' if it works
