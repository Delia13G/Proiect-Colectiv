INSERT INTO users (id, username, email, password_hash) VALUES 
(1, 'demo_data', 'data@test.com', '$2a$10$wT0l/eX1D.aK/LwzM./4.O2R.G1m1l1/1/1/1/1/1/1/1/1/1/1/1'),
(2, 'demo_friends', 'friends@test.com', '$2a$10$wT0l/eX1D.aK/LwzM./4.O2R.G1m1l1/1/1/1/1/1/1/1/1/1/1/1'),
(3, 'demo_jobs', 'jobs@test.com', '$2a$10$wT0l/eX1D.aK/LwzM./4.O2R.G1m1l1/1/1/1/1/1/1/1/1/1/1/1');

INSERT INTO profiles (id, user_id, profile_type, bio) VALUES 
(1, 1, 'Data', 'Pasionat de analiza datelor.'),
(2, 2, 'Friends', 'Caut să cunosc oameni noi și să particip la evenimente.'),
(3, 3, 'Jobs', 'Inginer software în căutare de noi oportunități profesionale.');

INSERT INTO lenses (id, profile_id, name, active) VALUES 
(1, 1, 'Data Lens', true),
(2, 2, 'Social Lens', true),
(3, 3, 'Career Lens', true);