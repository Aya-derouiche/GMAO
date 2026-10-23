CREATE TABLE equipement(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    location  VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
   status VARCHAR(50) NOT NULL,
   image TEXT,
   description  TEXT,
   add_date  DATE DEFAULT CURRENT_DATE,
   warranty_expiration_date DATE,
   cost FLOAT
); 

 ALTER TABLE equipement
   ADD COLUMN cout_intervention FLOAT ,
  ADD COLUMN duree_inter NUMERIC,
   ADD COLUMN  type_maint  VARCHAR(50),
   ADD COLUMN  date_debut TIMESTAMP,
   ADD COLUMN  date_fin TIMESTAMP,
   ADD COLUMN  fichier TEXT,
   ADD COLUMN  description_inter TEXT
;


INSERT INTO equipement (name, location, model, serial_number, status, image, description, warranty_expiration_date, cost) VALUES ('monitor', 'unit2', 'model1', 'mm10', 'active', 'moniteur.png', 'needs maintenance every single month', '2024-02-12', 10300);

/* postman test: post 
/*
{
    "name": "monitor",
    "location": "unit2",
    "model": "model1",
    "serial_number": "mm10",
    "status": "active",
    "image": "moniteur.png",
    "description": "needs maintenance every single month",
    "warranty_expiration_date": "2024-02-12",
    "cost": 10300
}*/
*/
CREATE TABLE employee(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    userid VARCHAR(50) NOT NULL,
    post VARCHAR(50) NOT NULL,
   documents TEXT,
   job_title VARCHAR(50),
   phone VARCHAR(50),
   email VARCHAR(100) ,
   add_date  DATE DEFAULT CURRENT_DATE
  
);

INSERT INTO employee (firstname, userid, post, documents, job_title, phone, email) VALUES ('aya2', 'ayader2', 'maintenance', 'x', 'mecanicien2', '6565644', 'aya@gmail.com');

CREATE TABLE secteur(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    ref VARCHAR(100) NOT NULL,
    lib VARCHAR(50) NOT NULL,
   description  TEXT,
   equipement_id BIGINT REFERENCES equipement(id),
   deleted BOOLEAN NOT NULL DEFAULT FALSE
);




INSERT INTO section (ref, lib, description, equipement_id) VALUES ('SEC001', 'Section A', 'Description de la section A', 24),
('SEC002', 'Section B', 'Description de la section B', 25);

CREATE TABLE component(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ref VARCHAR(100) NOT NULL,
   description  TEXT,
   breakdown_date DATE,
  equipement_id BIGINT NOT NULL REFERENCES equipement(id)
);

INSERT INTO component (name, ref, description, breakdown_date, equipement_id) 
VALUES 
    ('Component A', 'COMP001', 'Description du composant A', '2024-03-20', 36),
    ('Component B', 'COMP002', 'Description du composant B', '2024-03-21', 24);


ALTER TABLE equipement
ADD COLUMN type VARCHAR(255),
ADD cycle NUMERIC ;

CREATE TABLE prop_function(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
   unit VARCHAR(100) NOT NULL,
  component_id BIGINT NOT NULL REFERENCES component(id)
);

INSERT INTO prop_function (name, type, unit, component_id) 
VALUES 
    ('prop_function A', 'per periode ', 'per hour', 1),
    ('prop_function B', 'per metric', 'per Kilometre', 2);


CREATE TABLE prop_equip(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    current_value NUMERIC NOT NULL,
    cycle NUMERIC NOT NULL,
    last_maint_value NUMERIC,
    last_maint_date DATE,
    description TEXT,
    equipement_id BIGINT NOT NULL REFERENCES equipement(id),
    prop_function_id BIGINT NOT NULL REFERENCES prop_function(id)
);


INSERT INTO prop_equip (current_value, cycle, last_maint_value, last_maint_date, description, equipement_id, prop_function_id)
VALUES 
    (10.5, 24, 8.2, '2024-03-15', 'Description equipment A', 34, 4),
    (15.2, 36, NULL, NULL, 'Description equipment B', 24, 6);



CREATE TABLE prop_component(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    current_value NUMERIC NOT NULL,
    cycle NUMERIC NOT NULL,
    last_maint_value NUMERIC,
    last_maint_date DATE,
    description TEXT,
    component_id BIGINT NOT NULL REFERENCES component(id),
    prop_function_id BIGINT NOT NULL REFERENCES prop_function(id)
);

INSERT INTO prop_component (current_value, cycle, last_maint_value, last_maint_date, description, component_id, prop_function_id)
VALUES 
    (10.5, 24, 8.2, '2024-03-15', 'Description equipment A', 1, 4),
    (15.2, 36, 6.4, '2024-03-01', 'Description equipment B', 2, 6);

CREATE TABLE reclamation (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    ref TEXT NOT NULL,
    equipement_id BIGINT NOT NULL REFERENCES equipement(id),
      composant_id BIGINT REFERENCES composant(id),
    priority TEXT NOT NULL,
    state TEXT,
    created_by TEXT,
    responsible BIGINT NOT NULL REFERENCES employee(id),
    creation_date DATE DEFAULT CURRENT_DATE,
    final_date DATE,
    planified_date DATE,
    duration NUMERIC,
    description TEXT
);


INSERT INTO reclamation (ref, equipement_id, priority, state, created_by, responsible, final_date, planified_date, duration, description)
VALUES ('REF24', 24, 'High', 'Open', 'John Doe', '18', '2024-03-27', '2024-04-03', 4, 'Description of the reclamation'),
       ('REF32', 32, 'medium', 'Open', 'aya', '7', '2024-03-27', '2024-04-03', 2, 'Description of the reclamation');

       CREATE TABLE technicien(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    userid VARCHAR(50) NOT NULL,
    post VARCHAR(50) ,
   email VARCHAR(100) 
  
);

INSERT INTO employee (name, userid, post, email) VALUES ('fourat ben youssef','FR123' , 'responsable maintenance','fourat@gmail.com'),
('youssef','YS123' , '','youssef@gmail.com');


/*
CREATE SEQUENCE intervention_request_num_seq;

CREATE TABLE intervention (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    ref VARCHAR(50) NOT NULL,
    request_num VARCHAR(50) DEFAULT ('INT-' || NEXTVAL('intervention_request_num_seq')),
    request_date DATE DEFAULT CURRENT_DATE,
    hour_nbr INTEGER ,
    type_inter VARCHAR(50) NOT NULL,
    cost_inter NUMERIC(10, 2) NOT NULL,
    begin_date_hour TIMESTAMP NOT NULL,
    description TEXT,
    report TEXT,
    equipement_id BIGINT REFERENCES equipement(id),
    reclamation_id BIGINT REFERENCES reclamation(id),
    component_id BIGINT REFERENCES component(id),
    technicien_id BIGINT REFERENCES technicien(id)
);
*/



CREATE SEQUENCE intervention_request_num_seq;

CREATE TABLE intervention (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    ref VARCHAR(50) NOT NULL,
    request_num VARCHAR(50),
    request_date DATE DEFAULT CURRENT_DATE,
    hour_nbr INTEGER,
    type_inter VARCHAR(50) NOT NULL,
    cost_inter NUMERIC(10, 2) NOT NULL,
    begin_date_hour TIMESTAMP NOT NULL,
    description TEXT,
    report TEXT,
    equipement_id BIGINT REFERENCES equipement(id),
    reclamation_id BIGINT REFERENCES reclamation(id),
    component_id BIGINT REFERENCES component(id),
    technicien_id BIGINT REFERENCES technicien(id)
);

CREATE OR REPLACE FUNCTION generate_request_num()
RETURNS TRIGGER AS $$
BEGIN
    NEW.request_num :=  NEXTVAL('intervention_request_num_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_intervention
BEFORE INSERT ON intervention
FOR EACH ROW
EXECUTE FUNCTION generate_request_num();




INSERT INTO intervention (ref, request_date, hour_nbr, type_inter, cost_inter, begin_date_hour, description, report, equipement_id, reclamation_id, component_id, technicien_id)
VALUES ('REF2', '2024-03-28', 5, 'Type B', 100.00, '2024-03-28 08:00:00', 'Description of the intervention B', 'Report of the intervention', 30, 1, 1, 1);



CREATE TABLE affectation_inter(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    Duration NUMERIC NOT NULL,
 
    report TEXT,
    technicien_id BIGINT NOT NULL REFERENCES technicien(id),
    intervention_id BIGINT NOT NULL REFERENCES intervention(id)
);

INSERT INTO affectation_inter (Duration, report, technicien_id, intervention_id)
VALUES (5.5, 'Report example', 2, 1);

/*/***********/*/

CREATE TABLE component_inter (
    id BIGSERIAL PRIMARY KEY,
    repair_change TEXT,
    last_values TEXT,
    component_id BIGINT NOT NULL REFERENCES component(id),
    intervention_id BIGINT NOT NULL REFERENCES intervention(id)
);


INSERT INTO component_inter (repair_change, last_values, component_id, intervention_id)
VALUES ('Repair details', 'Last values information', 1, 1);



CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    userid VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    last_login TIMESTAMP,
    role VARCHAR(255) NOT NULL,
    UNIQUE (userid);
);


INSERT INTO users (name, userid, password, last_login, role)
VALUES ('Aya Derouiche', 'aya1', 'aya12888888', CURRENT_TIMESTAMP, 'admin');

ALTER TABLE prop_function
ADD COLUMN deleted BOOLEAN DEFAULT FALSE;



CREATE TABLE nomlogo(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
  image TEXT
 
);



ALTER TABLE prop_function ADD COLUMN equipement_name character varying(100);



CREATE TABLE unite(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    unit VARCHAR(50)
);

INSERT INTO unite (unit) VALUES
('piéce'),
('heure'),
('jours'),
('minute'),
('seconde');

ALTER TABLE equipement
ADD COLUMN unit_id BIGINT,
ADD CONSTRAINT fk_equipement_unit_id FOREIGN KEY (unit_id) REFERENCES unit(id);

ALTER TABLE equipement
ADD COLUMN cout_unit FLOAT ;

 ALTER TABLE equipement
   ADD COLUMN current_value NUMERIC ,
  ADD COLUMN last_maint_value NUMERIC,
   ADD COLUMN  last_maint_date DATE,
   ADD COLUMN  descriptionprev TEXT
;
ALTER TABLE equipement
ALTER COLUMN last_maint_date TYPE TIMESTAMP;




CREATE TABLE notifprev (
    id BIGINT ,
    name VARCHAR(50) ,
    current_value NUMERIC,
    cycle NUMERIC,
    last_maint_value NUMERIC,
    last_maint_date TIMESTAMP, 

);
CREATE TABLE notifprevcomp (
    id BIGINT,
    name_equip VARCHAR(50),
      name_comp VARCHAR(50) ,
    current_value NUMERIC,
    cycle NUMERIC,
    last_maint_value NUMERIC,
    last_maint_date TIMESTAMP WITHOUT TIME ZONE,
    technicien_id BIGINT,
    state TEXT,
    CONSTRAINT fk_technicien_id FOREIGN KEY (technicien_id) REFERENCES technicien(id)
);


-- Étape 1: Ajouter la colonne technicien_id à la table equipement
ALTER TABLE equipement
ADD COLUMN technicien_id bigint;

-- Étape 2: Ajouter la contrainte de clé étrangère sur technicien_id
ALTER TABLE equipement
ADD CONSTRAINT fk_equipement_technicien_id
FOREIGN KEY (technicien_id)
REFERENCES technicien(id)
ON UPDATE CASCADE
ON DELETE SET NULL;



CREATE TABLE maintenance_prev (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    current_value NUMERIC,
    cycle NUMERIC,
    last_maint_value NUMERIC,
    last_maint_date TIMESTAMP WITHOUT TIME ZONE,
    unit VARCHAR(10),
    next_maint_date TIMESTAMP WITHOUT TIME ZONE,
    technicien_id BIGINT,
    state TEXT,
    CONSTRAINT fk_equipement_technicien_id FOREIGN KEY (technicien_id) REFERENCES technicien(id)
);

CREATE TABLE maintenance_prevcomp (
    id BIGINT PRIMARY KEY,
    name_equip VARCHAR(50) ,
    name_comp VARCHAR(50) ,
    current_value NUMERIC,
    cycle NUMERIC,
    last_maint_value NUMERIC,
    last_maint_date TIMESTAMP WITHOUT TIME ZONE,
    unit VARCHAR(10),
    next_maint_date TIMESTAMP WITHOUT TIME ZONE,
    technicien_id BIGINT,
    state TEXT,
    CONSTRAINT fk_composant_technicien_id FOREIGN KEY (technicien_id) REFERENCES technicien(id)
);

-- Step 1: Create the composant table
CREATE TABLE composant (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    id_equip BIGINT,
    name_equip VARCHAR(50) NOT NULL,
    name_comp VARCHAR(50) NOT NULL,
    reference VARCHAR(50),
    type VARCHAR(50),
    cycle NUMERIC,
    unit VARCHAR(50),
    current_value NUMERIC,
    last_maint_value NUMERIC,
    last_maint_date TIMESTAMP,
    next_maint_date TIMESTAMP,
    description TEXT,
    fichier TEXT,
    deleted BOOLEAN DEFAULT FALSE
);

-- Step 2: Insert data from equipement into composant
INSERT INTO composant (id_equip, name_equip, name_comp, current_value)
SELECT id, name, '', current_value
FROM equipement;


UPDATE notifprev
SET state = 'En attente...'
WHERE technicien_id = 21 OR technicien_id = 25;


ALTER TABLE composant
ADD COLUMN deleted BOOLEAN DEFAULT FALSE;


CREATE TABLE preventive (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    ref TEXT NOT NULL,
    equipement_id BIGINT NOT NULL REFERENCES equipement(id) ON DELETE SET NULL,
    priority TEXT NOT NULL,
    state TEXT NOT NULL,
    created_by TEXT,
    responsible BIGINT NOT NULL REFERENCES employee(id),
    creation_date DATE DEFAULT CURRENT_DATE,
    final_date DATE,
    planified_date DATE,
    duration NUMERIC,
    description TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    affecter BOOLEAN,
    technicien_id BIGINT REFERENCES technicien(id),
    datepanne TIMESTAMP WITHOUT TIME ZONE,
    composant_id BIGINT REFERENCES composant(id),
    CONSTRAINT component_equipement_id_fkey FOREIGN KEY (equipement_id) REFERENCES equipement(id) ON DELETE SET NULL,
    CONSTRAINT reclamation_composant_id_fkey FOREIGN KEY (composant_id) REFERENCES composant(id),
    CONSTRAINT reclamation_equipement_id_fkey FOREIGN KEY (equipement_id) REFERENCES equipement(id),
    CONSTRAINT reclamation_responsible_fkey FOREIGN KEY (responsible) REFERENCES employee(id),
    CONSTRAINT reclamation_technicien_id_fkey FOREIGN KEY (technicien_id) REFERENCES technicien(id)
);
