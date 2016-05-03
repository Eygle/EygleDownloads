<?php
/**
 * Created by PhpStorm.
 * User: Johan
 * Date: 09/02/2015
 * Time: 18:15
 */

require_once("utils/FilesManager.php");
require_once("utils/Utils.php");

try {
    if ($_SERVER["REQUEST_METHOD"] == 'GET') {
        Utils::checkParams($_GET, "action", array(array("list_dir", "server_info")));

        switch($_GET['action']) {
            case 'list_dir':
                Utils::checkParams($_GET, "dir");
                echo json_encode(FilesManager::getDirFiles("../".$_GET['dir']));
                break;
            case 'server_info':
                $res = array();

                exec('df -h | head -n2 | tail -n1 | grep -o -P "([0-9]+[GMKOB%])"', $out);

                $res["size"] = $out[0];
                $res["used"] = $out[1];
                $res['available'] = $out[2];
                $res["used_percent"] = $out[3];

                echo json_encode($res);
                break;
        }
    } else if ($_SERVER["REQUEST_METHOD"] == "POST") {
        if (empty($_POST)) {
            $postdata = file_get_contents("php://input");
            $r = json_decode($postdata, true);
        } else {
            $r = $_POST;
        }

        Utils::checkParams($r, "action", array(array("download_tar", "delete")));

        switch ($r['action']) {
            case "download_tar":
                Utils::checkParams($r, array("tar_name", "files"));
                $fm = new FilesManager(is_array($r['files']) ? $r['files'] : json_decode($r['files'], true));
                $fm->createTar($r['tar_name']);
                $fm->downloadTarFile();
                $fm->deleteTarFile();
                break;
            case "delete":
                Utils::checkParams($r, array("files", "password"));
                Utils::checkPassword($r['password']);
                $fm = new FilesManager(is_array($r['files']) ? $r['files'] : json_decode($r['files'], true));
                $fm->delete();
                break;
        }
    } else {
        throw new Exception("Bad request.");
    }
} catch (Exception $e) {
    http_response_code(304);
    echo json_encode(array("Error" => $e->getMessage()));
}