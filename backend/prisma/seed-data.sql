-- ==== ACP USERS ====
INSERT INTO users (username, email, "passwordHash", "roleId", "zoneId", "districtId", "stateId", "isActive", "createdAt", "updatedAt") VALUES
('acp.south1', 'acp.south1@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 3, 1, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('acp.south2', 'acp.south2@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 3, 1, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('acp.north1', 'acp.north1@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 3, 2, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('acp.north2', 'acp.north2@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 3, 2, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('acp.east1', 'acp.east1@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 3, 3, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('acp.east2', 'acp.east2@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 3, 3, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- ==== SHO USERS ====
INSERT INTO users (username, email, "passwordHash", "roleId", "policeStationId", "districtId", "stateId", "isActive", "createdAt", "updatedAt") VALUES
('sho.charminar', 'sho.charminar@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 2, 1, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sho.falaknuma', 'sho.falaknuma@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 2, 2, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sho.begumpet', 'sho.begumpet@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 2, 3, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sho.musheerabad', 'sho.musheerabad@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 2, 4, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sho.malkajgiri', 'sho.malkajgiri@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 2, 5, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sho.uppal', 'sho.uppal@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 2, 6, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- ==== ZS USERS ====
INSERT INTO users (username, email, "passwordHash", "roleId", "divisionId", "zoneId", "districtId", "stateId", "isActive", "createdAt", "updatedAt") VALUES
('zs.charminar', 'zs.charminar@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 5, 1, 1, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('zs.falaknuma', 'zs.falaknuma@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 5, 2, 1, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('zs.begumpet', 'zs.begumpet@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 5, 3, 2, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('zs.musheerabad', 'zs.musheerabad@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 5, 4, 2, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('zs.malkajgiri', 'zs.malkajgiri@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 5, 5, 3, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('zs.uppal', 'zs.uppal@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 5, 6, 3, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- ==== DISTRICT LEVEL ROLES ====
INSERT INTO users (username, email, "passwordHash", "roleId", "districtId", "stateId", "isActive", "createdAt", "updatedAt") VALUES
('dcp.hyderabad', 'dcp.hyderabad@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 4, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cp.hyderabad', 'cp.hyderabad@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 10, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jtcp.hyderabad', 'jtcp.hyderabad@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 9, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aco.hyderabad', 'aco.hyderabad@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 13, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('arms_supdt.hyderabad', 'arms_supdt.hyderabad@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 11, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('arms_seat.hyderabad', 'arms_seat.hyderabad@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 12, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ado.hyderabad', 'ado.hyderabad@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 7, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cado.hyderabad', 'cado.hyderabad@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 8, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('as.hyderabad', 'as.hyderabad@gmail.com', '$2b$10$Z1fC60kC0rYPY/y.jUeZC.AxHZ9BaHk/8w2Cz.NIG7.x9AHpaP/Sa', 6, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);