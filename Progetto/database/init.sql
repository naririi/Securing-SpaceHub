-- init.sql
-- database init file

-- USERS: dati di esempio
-- da inserire nel keycloak

-- ROOMS: dati di esempio
INSERT INTO rooms (name, location, capacity)
VALUES
('Aula Gaming 1 (5v5)', 'Piano 0', 10),
('Aula Gaming 2 (3v3)', 'Piano 0', 10),
('Aula Gaming Grande', 'Piano 0', 20),
('Aula Streaming 1', 'Piano 0', 5),
('Aula Streaming 2', 'Piano 0', 5),
('Aula Studio 1', 'Piano 0', 5),
('Aula Studio 2', 'Piano 0', 5),
('Aula Studio 3', 'Piano 0', 5),
('Aula Riunioni 1', 'Piano 1', 20),
('Aula Riunioni 2', 'Piano 1', 50),
('Aula Riunioni 3', 'Piano 1', 20),
('Aula Riunioni 4', 'Piano 1', 50),
('Aula Lezioni 1', 'Piano 1', 60),
('Aula Lezioni 2', 'Piano 1', 60),
('Aula Lezioni 3', 'Piano 1', 60),
('Sala Riunioni 1 (Grande)', 'Piano 2', 80),
('Sala Riunioni 2 (Grande)', 'Piano 2', 80),
('Sala Riunioni 3 (Piccola)', 'Piano 2', 40),
('Sala Riunioni 4 (Piccola)', 'Piano 2', 40);


-- READERS: dati di esempio
INSERT INTO readers (room_id, reader_uid, public_key)
VALUES
(1, 'READER001', 
'-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArrJtdSCDi/rl5c7gfQra
oW8NjScSEoqj8VfwvPD9aSZuYMh3trNFBRt+3OCksJXRakohoHZGFx3L+ThtXMmD
n/mioSbfn5yBuAR9mSdHTIIDna1qZfEgRdpSPrAgd61ekuJ6EsseKKbz6et+bE1u
kFuCU2lUNn5CULEqIFS2eYKxpzdPKOzw+VxWjH5K8nAUUn8CIbageFKEOoOFg6eo
hmpcq3AqDnEVVErKuQ/PvQaDgtdgWEjmWTuK5WG9aqTceTvtSvz6OhHTLfOVkHiy
L1/DaAJvHrB68tEXlUAAHnrCZJ9Se/MgYQknkcO/ixN7QOrFCE1CZRS8RJepJAbS
LwIDAQAB
-----END PUBLIC KEY-----
'
),
(2, 'READER002', 'FAKE_PUBLIC_KEY_002'),
(3, 'READER003', 'FAKE_PUBLIC_KEY_003'),
(4, 'READER004', 'FAKE_PUBLIC_KEY_004'),
(5, 'READER005', 'FAKE_PUBLIC_KEY_005'),
(6, 'READER006', 'FAKE_PUBLIC_KEY_006'),
(7, 'READER007', 'FAKE_PUBLIC_KEY_007'),
(8, 'READER008', 'FAKE_PUBLIC_KEY_008'),
(9, 'READER009', 'FAKE_PUBLIC_KEY_009'),
(10, 'READER010', 'FAKE_PUBLIC_KEY_010'),
(11, 'READER011', 'FAKE_PUBLIC_KEY_011'),
(12, 'READER012', 'FAKE_PUBLIC_KEY_012'),
(13, 'READER013', 'FAKE_PUBLIC_KEY_013'),
(14, 'READER014', 'FAKE_PUBLIC_KEY_014'),
(15, 'READER015', 'FAKE_PUBLIC_KEY_015'),
(16, 'READER016', 'FAKE_PUBLIC_KEY_016'),
(17, 'READER017', 'FAKE_PUBLIC_KEY_017'),
(18, 'READER018', 'FAKE_PUBLIC_KEY_018'),
(19, 'READER019', 'FAKE_PUBLIC_KEY_019'),

-- CARDS: dati di esempio
-- ATTENZIONE: inserire user_id ottenuto da keycloak
INSERT INTO cards (user_id, card_uid)
VALUES
(1, 'CARD-GIU-001'),
(2, 'CARD-NARI-001'),
(3, 'CARD-ST-001'),
(4, 'CARD-PR-001'),
(5, 'CARD-ADMIN-001');

-- BOOKINGS: dati di esempio
INSERT INTO bookings (user_id, room_id, start_time, end_time)
VALUES
(1, 1, '2026-01-20 14:00:00', '2026-01-20 16:00:00'),
(1, 2, '2026-01-21 10:00:00', '2026-01-21 12:00:00'),
(1, 3, '2026-01-22 09:00:00', '2026-01-22 11:00:00');

-- ACCESS LOGS: dati di esempio
INSERT INTO access_logs (card_id, reader_id, access_granted, message)
VALUES
(1, 1, TRUE, 'Accesso consentito: Prenotazione valida'),
(1, 2, FALSE, 'Accesso negato: Nessuna prenotazione'),
(3, 3, TRUE, 'Accesso admin – Override');
