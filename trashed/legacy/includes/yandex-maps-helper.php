<?php
/**
 * Хелпер для Yandex Maps: геокодер, подсказки адресов, ближайшее метро.
 * Ключи: YANDEX_GEOCODER_API_KEY (JavaScript API и HTTP Геокодер), YANDEX_STATIC_API_KEY (Static API).
 */

class YandexMapsHelper {
    private $geocoderApiKey;
    private $staticApiKey;

    public function __construct($geocoderApiKey = null, $staticApiKey = null) {
        $this->geocoderApiKey = $geocoderApiKey ?: (defined('YANDEX_GEOCODER_API_KEY') ? YANDEX_GEOCODER_API_KEY : getenv('YANDEX_GEOCODER_API_KEY'));
        $this->staticApiKey = $staticApiKey ?: (defined('YANDEX_STATIC_API_KEY') ? YANDEX_STATIC_API_KEY : getenv('YANDEX_STATIC_API_KEY'));
    }

    /**
     * Подсказки адресов (Yandex Suggest).
     * @param string $query Строка поиска
     * @param int $results Максимум подсказок
     * @return array [['display_name' => string, 'address' => string, 'lat' => float, 'lon' => float], ...]
     */
    public function suggestAddresses($query, $results = 10) {
        $key = $this->geocoderApiKey;
        if (empty($key)) {
            return [];
        }
        $url = 'https://suggest-maps.yandex.ru/v1/suggest?' . http_build_query([
            'apikey' => $key,
            'text' => $query,
            'types' => 'geo',
            'results' => min($results, 10),
            'lang' => 'ru_RU',
        ]);
        $ctx = stream_context_create(['http' => ['timeout' => 5]]);
        $response = @file_get_contents($url, false, $ctx);
        if ($response === false) {
            return [];
        }
        $data = json_decode($response, true);
        $out = [];
        if (isset($data['results']) && is_array($data['results'])) {
            foreach ($data['results'] as $item) {
                $title = isset($item['title']['text']) ? $item['title']['text'] : '';
                $subtitle = isset($item['subtitle']['text']) ? $item['subtitle']['text'] : '';
                $displayName = $subtitle ? $title . ', ' . $subtitle : $title;
                $lat = null;
                $lon = null;
                if (isset($item['uri'])) {
                    $geo = $this->geocode($item['uri']);
                    if ($geo) {
                        $lat = $geo['lat'];
                        $lon = $geo['lon'];
                    }
                }
                if ($lat === null && $lon === null && $displayName !== '') {
                    $geo = $this->geocode($displayName);
                    if ($geo) {
                        $lat = $geo['lat'];
                        $lon = $geo['lon'];
                    }
                }
                $out[] = [
                    'display_name' => $displayName,
                    'address' => $displayName,
                    'lat' => $lat,
                    'lon' => $lon,
                ];
            }
        }
        return $out;
    }

    /**
     * Геокодирование адреса или URI — получить координаты.
     */
    public function geocode($address) {
        $key = $this->geocoderApiKey;
        if (empty($key)) {
            return null;
        }
        $url = 'https://geocode-maps.yandex.ru/1.x/?' . http_build_query([
            'apikey' => $key,
            'geocode' => $address,
            'format' => 'json',
            'results' => 1,
            'lang' => 'ru_RU',
        ]);
        $ctx = stream_context_create(['http' => ['timeout' => 5]]);
        $response = @file_get_contents($url, false, $ctx);
        if ($response === false) {
            return null;
        }
        $data = json_decode($response, true);
        $pos = $this->extractFirstPoint($data);
        return $pos;
    }

    private function extractFirstPoint($data) {
        if (empty($data['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']['Point']['pos'])) {
            return null;
        }
        $pos = $data['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']['Point']['pos'];
        $parts = explode(' ', trim($pos));
        if (count($parts) >= 2) {
            return ['lon' => (float)$parts[0], 'lat' => (float)$parts[1]];
        }
        return null;
    }

    /**
     * Ближайшие станции метро к точке (lat, lng).
     * Используется HTTP Геокодер Yandex: geocode=lon,lat&kind=metro.
     * @param float $lat Широта
     * @param float $lng Долгота
     * @param int $limit Количество станций
     * @return array [['name' => string, 'distance_text' => string, 'walk_time_text' => string, 'drive_time_text' => string], ...]
     */
    public function findNearestMetro($lat, $lng, $limit = 3) {
        $key = $this->geocoderApiKey;
        if (empty($key)) {
            return [];
        }
        $url = 'https://geocode-maps.yandex.ru/1.x/?' . http_build_query([
            'apikey' => $key,
            'geocode' => $lng . ',' . $lat,
            'kind' => 'metro',
            'results' => $limit,
            'format' => 'json',
            'lang' => 'ru_RU',
        ]);
        $ctx = stream_context_create(['http' => ['timeout' => 8]]);
        $response = @file_get_contents($url, false, $ctx);
        if ($response === false) {
            return [];
        }
        $data = json_decode($response, true);
        $stations = [];
        $members = $data['response']['GeoObjectCollection']['featureMember'] ?? [];
        foreach (array_slice($members, 0, $limit) as $m) {
            $obj = $m['GeoObject'] ?? [];
            $name = $obj['name'] ?? 'Станция метро';
            $meta = $obj['metaDataProperty']['GeocoderMetaData'] ?? [];
            $text = $meta['text'] ?? $name;
            $pos = isset($obj['Point']['pos']) ? explode(' ', $obj['Point']['pos']) : null;
            $distance = '';
            $walkTime = '';
            $driveTime = '';
            if ($pos && count($pos) >= 2) {
                $mlon = (float)$pos[0];
                $mlat = (float)$pos[1];
                $km = $this->haversineDistance($lat, $lng, $mlat, $mlon);
                $distance = $km < 1 ? round($km * 1000) . ' м' : round($km, 2) . ' км';
                $walkMin = max(1, (int)round($km * 12));
                $walkTime = $walkMin . ' мин';
                $driveMin = max(1, (int)round($km * 2.5));
                $driveTime = $driveMin . ' мин';
            }
            $stations[] = [
                'name' => $name,
                'distance_text' => $distance,
                'walk_time_text' => $walkTime,
                'drive_time_text' => $driveTime,
            ];
        }
        return $stations;
    }

    private function haversineDistance($lat1, $lon1, $lat2, $lon2) {
        $r = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2)*sin($dLat/2) + cos(deg2rad($lat1))*cos(deg2rad($lat2))*sin($dLon/2)*sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return $r * $c;
    }

    /**
     * URL статической карты (Static API).
     */
    public function getStaticMapUrl($lat, $lng, $width = 800, $height = 600, $zoom = 15) {
        $key = $this->staticApiKey;
        $pt = $lng . ',' . $lat;
        $size = $width . ',' . $height;
        $ll = $lng . ',' . $lat;
        if ($key) {
            return sprintf('https://static-maps.yandex.ru/1.x/?ll=%s&size=%s&z=%d&l=map&pt=%s,pm2rdm&apikey=%s', $ll, $size, $zoom, $pt, urlencode($key));
        }
        return sprintf('https://static-maps.yandex.ru/1.x/?ll=%s&size=%s&z=%d&l=map&pt=%s,pm2rdm', $ll, $size, $zoom, $pt);
    }
}

if (!function_exists('getYandexMapsHelper')) {
    function getYandexMapsHelper() {
        static $instance = null;
        if ($instance === null) {
            $instance = new YandexMapsHelper();
        }
        return $instance;
    }
}
