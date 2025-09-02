-- Create admin user profile for ostyn.r@gmail.com
INSERT INTO profiles (id, role, display_name) 
VALUES ('9c6c4694-8cf3-4a57-9837-dd13e5ee45ab', 'admin', 'ostyn.r@gmail.com')
ON CONFLICT (id) DO UPDATE SET role = 'admin';