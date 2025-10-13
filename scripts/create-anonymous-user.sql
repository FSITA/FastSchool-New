-- Create an anonymous user for the application
INSERT INTO "User" (id, name, email, role, "hasAccess", "createdAt", "updatedAt")
VALUES ('anonymous-user', 'Anonymous User', 'anonymous@example.com', 'USER', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
