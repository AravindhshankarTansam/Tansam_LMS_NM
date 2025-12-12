-- ===============================================
-- MASTER TABLES (HUD -> BLOCK -> HSC -> PHC)
-- ===============================================
CREATE TABLE IF NOT EXISTS hud_master (
  hud_id INT AUTO_INCREMENT PRIMARY KEY,
  hud_name VARCHAR(255) NOT NULL,
  hud_code VARCHAR(10) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS block_master (
  block_id INT AUTO_INCREMENT PRIMARY KEY,
  block_name VARCHAR(255) NOT NULL,
  block_code VARCHAR(10) UNIQUE,
  hud_id INT NOT NULL,
  FOREIGN KEY (hud_id) REFERENCES hud_master(hud_id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hsc_master (
  hsc_id INT AUTO_INCREMENT PRIMARY KEY,
  hsc_name VARCHAR(255) NOT NULL,
  hsc_code VARCHAR(10) UNIQUE,
  block_id INT NOT NULL,
  FOREIGN KEY (block_id) REFERENCES block_master(block_id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phc_master (
  phc_id INT AUTO_INCREMENT PRIMARY KEY,
  phc_name VARCHAR(255) NOT NULL,
  phc_code VARCHAR(10) UNIQUE,
  hsc_id INT NOT NULL,
  FOREIGN KEY (hsc_id) REFERENCES hsc_master(hsc_id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- USERS & ROLES
-- ===============================================
CREATE TABLE IF NOT EXISTS users (
  email VARCHAR(255) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'student','staff') NOT NULL,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_by VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS superadmin_details (
  user_email VARCHAR(255) PRIMARY KEY,
  custom_id VARCHAR(50) UNIQUE,
  full_name VARCHAR(255),
  mobile_number VARCHAR(20),
  image_path TEXT,
  FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_details (
  user_email VARCHAR(255) PRIMARY KEY,
  custom_id VARCHAR(50) UNIQUE,
  full_name VARCHAR(255),
  mobile_number VARCHAR(20),
  image_path TEXT,
  hud_id INT,
  block_id INT,
  hsc_id INT,
  phc_id INT,
  FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_details (
  user_email VARCHAR(255) PRIMARY KEY,
  custom_id VARCHAR(50) UNIQUE,
  full_name VARCHAR(255),
  mobile_number VARCHAR(20),
  image_path TEXT,
  student_type ENUM('doctor', 'staff_nurse') DEFAULT 'doctor',
  hud_id INT,
  block_id INT,
  hsc_id INT,
  phc_id INT,
  FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
  FOREIGN KEY (hud_id) REFERENCES hud_master(hud_id) ON DELETE SET NULL,
  FOREIGN KEY (block_id) REFERENCES block_master(block_id) ON DELETE SET NULL,
  FOREIGN KEY (hsc_id) REFERENCES hsc_master(hsc_id) ON DELETE SET NULL,
  FOREIGN KEY (phc_id) REFERENCES phc_master(phc_id) ON DELETE SET NULL
);

-- ===============================================
-- COURSE STRUCTURE
-- ===============================================
CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  course_id INT AUTO_INCREMENT PRIMARY KEY,
  course_name VARCHAR(255) NOT NULL,
  category_id INT,
  course_image TEXT,
  course_video TEXT,
  description TEXT,
  requirements TEXT,
  overview TEXT,
  pricing_type ENUM('free', 'paid') DEFAULT 'free',
  price_amount DECIMAL(10,2) DEFAULT 0,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  is_active ENUM('active', 'inactive') DEFAULT 'active',
  created_by VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(email) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS modules (
  module_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  module_name VARCHAR(255) NOT NULL,
  order_index INT DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chapters (
  chapter_id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  chapter_name VARCHAR(255) NOT NULL,
  materials_json JSON,
  order_index INT DEFAULT 0,
  FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chapter_materials (
  material_id INT AUTO_INCREMENT PRIMARY KEY,
  chapter_id INT NOT NULL,
  material_type ENUM('video','pdf','ppt','doc','flowchart'),
  file_name VARCHAR(255),
  file_path TEXT,
  file_size_kb DECIMAL(10,2),
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE CASCADE
);

-- ===============================================
-- QUIZZES (CHAPTER-LEVEL)
-- ===============================================
CREATE TABLE IF NOT EXISTS quizzes (
  quiz_id INT AUTO_INCREMENT PRIMARY KEY,
  chapter_id INT NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT NOT NULL,
  question_type ENUM('mcq','true_false') DEFAULT 'mcq',
  FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE CASCADE
);

-- CREATE TABLE IF NOT EXISTS quiz_results (
--   result_id INT AUTO_INCREMENT PRIMARY KEY,
--   custom_id VARCHAR(50) NOT NULL,
--   quiz_id INT NOT NULL,
--   selected_answer TEXT,
--   is_correct BOOLEAN,
--   attempt_number INT DEFAULT 1,
--   attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
-- );

  CREATE TABLE IF NOT EXISTS quiz_results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  custom_id VARCHAR(50) NOT NULL,
  quiz_id INT NOT NULL,
  chapter_id INT NOT NULL,          -- Added
  selected_answer TEXT,
  is_correct BOOLEAN,
  progress_percent INT DEFAULT 0,   -- Added
  attempt_number INT DEFAULT 1,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE CASCADE
);



-- ===============================================
-- COURSE ENROLLMENT & PROGRESS
-- ===============================================
CREATE TABLE IF NOT EXISTS course_enrollments (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  custom_id VARCHAR(50) NOT NULL,
  course_id INT NOT NULL,
  enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- completion_deadline DATETIME,
  completed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_progress (
  progress_id INT AUTO_INCREMENT PRIMARY KEY,
  custom_id VARCHAR(50) NOT NULL,
  course_id INT NOT NULL,
  last_module_id INT,
  last_chapter_id INT,
  last_visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  progress_percent DECIMAL(5,2) DEFAULT 0,
  UNIQUE KEY unique_progress (custom_id, course_id),
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_progress_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  custom_id VARCHAR(50) NOT NULL,
  course_id INT NOT NULL,
  module_id INT NOT NULL,
  chapter_id INT NOT NULL,
  status ENUM('started','in_progress','completed') DEFAULT 'in_progress',
  visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);


-- ===============================================
-- FINAL COURSE QUIZZES
-- ===============================================
CREATE TABLE IF NOT EXISTS course_final_quizzes (
  final_quiz_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT NOT NULL,
  question_type ENUM('mcq','true_false') DEFAULT 'mcq',
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_final_results (
  final_result_id INT AUTO_INCREMENT PRIMARY KEY,
  custom_id VARCHAR(50) NOT NULL,
  final_quiz_id INT NOT NULL,
  selected_answer TEXT,
  is_correct BOOLEAN,
  attempt_number INT DEFAULT 1,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (final_quiz_id) REFERENCES course_final_quizzes(final_quiz_id) ON DELETE CASCADE
);

-- ===============================================
-- USER RESTRICTIONS / NOTIFICATIONS
-- ===============================================
CREATE TABLE IF NOT EXISTS user_restrictions (
  restriction_id INT AUTO_INCREMENT PRIMARY KEY,
  custom_id VARCHAR(50) NOT NULL,
  reason TEXT,
  restriction_type ENUM('ban','cooldown','deadline_miss'),
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  custom_id VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('unread','read') DEFAULT 'unread',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_completion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  custom_id VARCHAR(50) NOT NULL,
  material_id INT NOT NULL,
  chapter_id INT NOT NULL,
  course_id INT NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_material_user (custom_id, material_id),
  FOREIGN KEY (material_id) REFERENCES chapter_materials(material_id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chapter_completion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  custom_id VARCHAR(50) NOT NULL,
  course_id INT NOT NULL,
  chapter_id INT NOT NULL,
  completed TINYINT(1) DEFAULT 1,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_chapter (custom_id, chapter_id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS staff_details (
  user_email VARCHAR(255) NOT NULL PRIMARY KEY,
  custom_id VARCHAR(50) UNIQUE,
  full_name VARCHAR(255),
  mobile_number VARCHAR(20),
  image_path TEXT,
  course_id INT,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL,
FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
  
);