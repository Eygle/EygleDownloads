<?php
/**
 * Created by PhpStorm.
 * User: Johan
 * Date: 09/02/2015
 * Time: 17:44
 */

class FilesManager {
    private static $EXCLUDE_FILES = array(".", "..");
    private static $TAR_DIR = "../tar/";

    private $paths;
    private $tarName;

    public function __construct($p) {
        $this->paths = $p;
    }

    public function delete() {
        foreach ($this->paths as $p) {
            exec("rm -rf \"../$p\"");
            exec("echo \"" . dirname(dirname(dirname(__FILE__))) . "/$p\" >> ../to_del");
        }
    }

    public function createTar($tarName) {
        $tarName = FilesManager::$TAR_DIR.uniqid().'_'.$tarName;

        exec("find ".FilesManager::$TAR_DIR."* -mtime +1 -exec rm {} ;");

        $toTar = "";
        foreach ($this->paths as $p) {
            if (file_exists("../$p")) {
                $toTar .= ' "' . substr($p, strlen("content/")) . '"';
            }
        }

        if ($toTar == "") {
            throw new Exception("Cannot create tar $tarName because no existing files were to add in.");
        }

        exec("cd ../content && tar cvf \"$tarName\" $toTar", $arr, $out);

        $this->tarName = $tarName;

        if ($out != 0)
            throw new Exception("Cannot create tar $tarName with $toTar");
    }

    public function downloadTarFile() {
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header("Content-Disposition: attachment; filename='$this->tarName'");
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');
        header('Content-Length: ' . filesize($this->tarName));
        ob_clean();
        flush();
        readfile($this->tarName);
    }

    public function deleteTarFile() {
        @unlink($this->tarName);
    }

    public static function getDirFiles($dir) {
        $arr = array();
        $dir_files = FilesManager::scan_dir($dir);
        $path = $dir."/";
        $id = 0;

        foreach ($dir_files as $f) {
            if (is_dir($path.$f)) {
                $bytes = FilesManager::get_folder_size($path.$f);
                $arr[] = array(
                    "id"=>$id++,
                    "name"=>$f,
                    "type"=>"folder",
                    "path"=>FilesManager::format_path($path),
                    "bytes" => $bytes,
                    "size" => FilesManager::format_size($bytes),
                    "modified" => filemtime($path.$f) * 1000);
            } else {
                $infos = pathinfo($path.$f);
                $bytes = filesize($path.$f);
                $arr[] = array(
                    "id"=>$id++,
                    "name"=>$f,
                    "type"=>isset($infos['extension']) ? $infos['extension'] : 'default',
                    "path"=>FilesManager::format_path($path),
                    "size" => FilesManager::format_size($bytes),
                    "bytes" => $bytes,
                    "modified" => filemtime($path.$f) * 1000);
            }
        }
        return $arr;
    }

    private static function scan_dir($dir) {
        $files = scandir($dir, SCANDIR_SORT_ASCENDING);
        foreach ($files as $i => $file) {
            if (in_array($file, FilesManager::$EXCLUDE_FILES))
                unset($files[$i]);
        }
        return ($files) ? $files : [];
    }

    private static function get_folder_size($dir) {
        $size = 0;
        $path = $dir."/";
        $files = FilesManager::scan_dir($path);

        foreach ($files as $f) {
            if (is_dir($path . $f)) {
                $size += FilesManager::get_folder_size($path . $f);
            } else {
                $size += filesize($path . $f);
            }
        }

        return $size;
    }

    private static function format_size($bytes) {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $precision = 2;

        $bytes /= pow(1024, $pow);


        //$bytes /= (1 << (10 * $pow));

        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    private static function format_path($path) {
        return strlen($path) > 3 ? substr($path, 3) : "";
    }
}