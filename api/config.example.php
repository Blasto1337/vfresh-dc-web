<?php
// Vzor. Skutečný api/config.php vytváří GitHub Actions při nasazení
// (viz .github/workflows/deploy.yml) a do gitu nepatří.
return [
    'site'      => 'vfresh.cz',
    'admin_url' => 'https://viktoria-tabor.cz/admin/',
    'origins'   => ['https://vfresh.cz', 'https://www.vfresh.cz'],
    'from'      => 'info@vfresh.cz',
    'from_name' => 'Web VFRESH DC',
    'to'        => ['info@vfresh.cz'],
    'smtp'      => [
        'host'   => 'smtp.seznam.cz',
        'port'   => 465,
        'secure' => 'ssl',          // ssl (465) | tls (587, STARTTLS)
        'user'   => 'info@vfresh.cz',
        'pass'   => 'HESLO',
    ],
];
