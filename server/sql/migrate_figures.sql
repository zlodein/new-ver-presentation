-- Библиотека фигур (геометрия/контур) без стилей/координат.
-- Выполнить для MySQL.

CREATE TABLE IF NOT EXISTS `figures` (
  `id` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `kind` varchar(50) NOT NULL,
  `geometry` longtext NOT NULL, -- JSON string
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `figures_created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `figures` (`id`, `name`, `kind`, `geometry`)
VALUES
  -- Basic Shapes
  ('f0000000-0000-0000-0000-000000000001', 'Прямоугольник', 'rect', '{"kind":"rect","rx":0}'),
  ('f0000000-0000-0000-0000-000000000002', 'Овал', 'ellipse', '{"kind":"ellipse","cx":50,"cy":50,"rx":50,"ry":30}'),
  ('f0000000-0000-0000-0000-000000000003', 'Треугольник', 'polygon', '{"kind":"polygon","points":[[50,8],[8,92],[92,92]]}'),
  ('f0000000-0000-0000-0000-000000000004', 'Ромб', 'polygon', '{"kind":"polygon","points":[[50,5],[95,50],[50,95],[5,50]]}'),
  ('f0000000-0000-0000-0000-000000000005', 'Скругленный прямоугольник', 'roundedRect', '{"kind":"roundedRect","rx":12}'),
  ('f0000000-0000-0000-0000-000000000006', 'Круг', 'circle', '{"kind":"circle","cx":50,"cy":50,"r":40}'),
  ('f0000000-0000-0000-0000-000000000007', 'Параллелограмм', 'polygon', '{"kind":"polygon","points":[[20,25],[80,25],[100,75],[40,75]]}'),
  ('f0000000-0000-0000-0000-000000000008', 'Трапеция', 'polygon', '{"kind":"polygon","points":[[20,20],[80,20],[100,80],[0,80]]}'),
  ('f0000000-0000-0000-0000-000000000009', 'Сердце', 'path', '{"kind":"path","d":"M50 84 C20 65 10 40 25 28 C35 20 46 26 50 34 C54 26 65 20 75 28 C90 40 80 65 50 84 Z"}'),
  ('f0000000-0000-0000-0000-000000000010', 'Молния', 'polygon', '{"kind":"polygon","points":[[60,0],[45,40],[65,40],[52,100],[58,62],[35,62]]}'),
  ('f0000000-0000-0000-0000-000000000011', 'Солнце', 'star', '{"kind":"star","points":16,"innerRatio":0.5}'),
  ('f0000000-0000-0000-0000-000000000012', 'Луна', 'path', '{"kind":"path","d":"M70 20 A28 28 0 1 1 55 80 A22 22 0 1 0 70 20 Z"}'),
  ('f0000000-0000-0000-0000-000000000013', 'Куб', 'path', '{"kind":"path","d":"M35 30 L65 30 L85 50 L65 70 L35 70 L15 50 Z"}'),
  ('f0000000-0000-0000-0000-000000000014', 'Цилиндр', 'path', '{"kind":"path","d":"M30 40 C30 25 70 25 70 40 V60 C70 75 30 75 30 60 Z"}'),

  -- Lines
  ('f0000000-0000-0000-0000-000000000015', 'Линия', 'line', '{"kind":"line","x1":10,"y1":50,"x2":90,"y2":50,"head":"none"}'),
  ('f0000000-0000-0000-0000-000000000016', 'Стрелка', 'line', '{"kind":"line","x1":10,"y1":50,"x2":90,"y2":50,"head":"end"}'),
  ('f0000000-0000-0000-0000-000000000017', 'Двунаправленная стрелка', 'line', '{"kind":"line","x1":10,"y1":50,"x2":90,"y2":50,"head":"both"}'),
  ('f0000000-0000-0000-0000-000000000018', 'Curved Connector', 'connector', '{"kind":"connector","mode":"curved","x1":10,"y1":50,"x2":90,"y2":50,"c1x":30,"c1y":10,"c2x":70,"c2y":90,"head":"end"}'),
  ('f0000000-0000-0000-0000-000000000019', 'Elbow Connector', 'connector', '{"kind":"connector","mode":"elbow","x1":10,"y1":50,"x2":90,"y2":90,"elbowMidX":60,"elbowMidY":50,"head":"end"}'),
  ('f0000000-0000-0000-0000-000000000020', 'Straight Connector', 'connector', '{"kind":"connector","mode":"straight","x1":10,"y1":50,"x2":90,"y2":50,"head":"none"}'),
  ('f0000000-0000-0000-0000-000000000021', 'Кривая (Curve)', 'polyline', '{"kind":"polyline","points":[[10,60],[30,20],[50,80],[70,20],[90,60]]}'),
  ('f0000000-0000-0000-0000-000000000022', 'Полилиния (Freeform)', 'polyline', '{"kind":"polyline","points":[[10,50],[25,65],[40,40],[55,70],[70,30],[90,50]]}'),
  ('f0000000-0000-0000-0000-000000000023', 'Scribble (Карандаш)', 'scribble', '{"kind":"scribble","points":[[10,50],[20,40],[30,60],[40,45],[50,70],[60,55],[70,75],[80,60],[90,80]]}'),

  -- Block Arrows
  ('f0000000-0000-0000-0000-000000000024', 'Стрелка вправо', 'line', '{"kind":"line","x1":10,"y1":50,"x2":90,"y2":50,"head":"end"}'),
  ('f0000000-0000-0000-0000-000000000025', 'Стрелка влево', 'line', '{"kind":"line","x1":90,"y1":50,"x2":10,"y2":50,"head":"end"}'),
  ('f0000000-0000-0000-0000-000000000026', 'Стрелка вверх', 'line', '{"kind":"line","x1":50,"y1":90,"x2":50,"y2":10,"head":"end"}'),
  ('f0000000-0000-0000-0000-000000000027', 'Стрелка вниз', 'line', '{"kind":"line","x1":50,"y1":10,"x2":50,"y2":90,"head":"end"}'),
  ('f0000000-0000-0000-0000-000000000028', 'Chevron', 'polygon', '{"kind":"polygon","points":[[20,50],[50,75],[80,50],[50,25]]}'),
  ('f0000000-0000-0000-0000-000000000029', 'Curved Arrow (пример)', 'connector', '{"kind":"connector","mode":"curved","x1":10,"y1":70,"x2":90,"y2":50,"c1x":25,"c1y":10,"c2x":70,"c2y":95,"head":"end"}'),
  ('f0000000-0000-0000-0000-000000000030', 'Bent Arrow (пример)', 'connector', '{"kind":"connector","mode":"elbow","x1":10,"y1":60,"x2":90,"y2":60,"elbowMidX":60,"elbowMidY":20,"head":"end"}'),
  ('f0000000-0000-0000-0000-000000000031', 'Circular Arrow (пример)', 'connector', '{"kind":"connector","mode":"curved","x1":20,"y1":65,"x2":80,"y2":35,"c1x":0,"c1y":20,"c2x":100,"c2y":90,"head":"end"}'),
  ('f0000000-0000-0000-0000-000000000032', 'Striped Arrow (dash вручную)', 'line', '{"kind":"line","x1":10,"y1":50,"x2":90,"y2":50,"head":"end"}'),

  -- Flowchart Shapes
  ('f0000000-0000-0000-0000-000000000033', 'Process (скругленный прямоугольник)', 'roundedRect', '{"kind":"roundedRect","rx":18}'),
  ('f0000000-0000-0000-0000-000000000034', 'Decision (ромб)', 'polygon', '{"kind":"polygon","points":[[50,10],[90,50],[50,90],[10,50]]}'),
  ('f0000000-0000-0000-0000-000000000035', 'Data (параллелограмм)', 'polygon', '{"kind":"polygon","points":[[25,25],[75,25],[95,50],[45,50]]}'),
  ('f0000000-0000-0000-0000-000000000036', 'Document', 'path', '{"kind":"path","d":"M20 15 H70 L90 35 V85 H20 Z M70 15 V35 H90 Z"}'),
  ('f0000000-0000-0000-0000-000000000037', 'Connector (круг)', 'circle', '{"kind":"circle","cx":50,"cy":50,"r":28}'),
  ('f0000000-0000-0000-0000-000000000038', 'Predefined Process (октагон)', 'polygon', '{"kind":"polygon","points":[[25,10],[75,10],[90,25],[90,75],[75,90],[25,90],[10,75],[10,25]]}'),
  ('f0000000-0000-0000-0000-000000000039', 'Terminator', 'roundedRect', '{"kind":"roundedRect","rx":28}'),

  -- Stars & Banners
  ('f0000000-0000-0000-0000-000000000040', 'Star 4', 'star', '{"kind":"star","points":4,"innerRatio":0.5}'),
  ('f0000000-0000-0000-0000-000000000041', 'Star 5', 'star', '{"kind":"star","points":5,"innerRatio":0.5}'),
  ('f0000000-0000-0000-0000-000000000042', 'Star 8', 'star', '{"kind":"star","points":8,"innerRatio":0.5}'),
  ('f0000000-0000-0000-0000-000000000043', 'Star 16', 'star', '{"kind":"star","points":16,"innerRatio":0.5}'),
  ('f0000000-0000-0000-0000-000000000044', 'Explosion', 'star', '{"kind":"star","points":24,"innerRatio":0.35}'),
  ('f0000000-0000-0000-0000-000000000045', 'Ribbon', 'path', '{"kind":"path","d":"M10 45 C25 25 45 25 50 45 C55 65 75 65 90 45 L90 55 C75 75 55 75 50 55 C45 35 25 35 10 55 Z"}'),
  ('f0000000-0000-0000-0000-000000000046', 'Wavy Ribbon (band)', 'path', '{"kind":"path","d":"M10 55 C25 35 45 75 60 55 C70 45 80 65 90 55 L90 60 C80 75 70 55 60 65 C45 85 25 45 10 60 Z"}'),
  ('f0000000-0000-0000-0000-000000000047', 'Callout (выноска)', 'polygon', '{"kind":"polygon","points":[[10,25],[90,25],[90,45],[100,55],[90,65],[90,85],[10,85],[10,25]]}'),
  ('f0000000-0000-0000-0000-000000000048', 'Star 24', 'star', '{"kind":"star","points":24,"innerRatio":0.5}'),
  ('f0000000-0000-0000-0000-000000000049', 'Star 32', 'star', '{"kind":"star","points":32,"innerRatio":0.5}');

ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `kind` = VALUES(`kind`),
  `geometry` = VALUES(`geometry`);

