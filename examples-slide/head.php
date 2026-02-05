<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?php echo escape($presentation['title']); ?> - Редактор</title>
<!-- Tabler Core CSS -->
<link href="/dashboard/dist/css/tabler.min.css?v=1.4.0" rel="stylesheet" />
<link href="/dashboard/dist/css/tabler-vendors.min.css?v=1.4.0" rel="stylesheet" />
<link href="/dashboard/dist/css/tabler-themes.css?v=1.4.0" rel="stylesheet" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="/assets/css/main.css?v=3" />
<link rel="stylesheet" type="text/css" href="/assets/css/slide-layout.css?v=3" />
<link rel="stylesheet" type="text/css" href="/assets/css/slide-styles.css?v=3" />
<link rel="stylesheet" type="text/css" href="/assets/css/customization.css?v=3" />
<link rel="stylesheet" type="text/css" href="/assets/css/custom.css?v=3" />
<style>
    :root {--theme-main-color: <?php echo $themeColor; ?>;}
    body.theme-<?php echo $presentation['theme_style'] ?? 'classic'; ?> { }
</style>