#!/bin/bash

# ask where the base install should go.
BASE_DIR=/srv/pit
DB_FILE=$BASE_DIR/data/pit.db

function create_dirs() {
    test -d $BASE_DIR || mkdir $_
    test -d $BASE_DIR/tmp || mkdir $_
    chown http $BASE_DIR/tmp

    test -d $BASE_DIR/data || mkdir $_
    chown http $BASE_DIR/data
}

function create_db() {
    # Initial database schema.  Once there is data in the file, any changes will need to be done differently.
    cat > $BASE_DIR/tmp/pit.db.sql << EOF
CREATE TABLE Users (
  UserID INTEGER UNIQUE PRIMARY KEY,
  IDHash STRING UNIQUE,
  Guard STRING,
  GuardHash STRING,
  RecoveryPack STRING,
  PublicKey STRING,
  OrgHash STRING
);

CREATE TABLE Organisations (
  OrgID INTEGER UNIQUE PRIMARY KEY,
  OrgHash STRING UNIQUE,
  OrgPack STRING,
  PublicKey STRING
);

EOF

    sqlite3 $DB_FILE < $BASE_DIR/tmp/pit.db.sql
    local RESULT=$?
    rm $BASE_DIR/tmp/pit.db.sql
    chown http $DB_FILE

    return $RESULT
}

create_dirs
create_db




