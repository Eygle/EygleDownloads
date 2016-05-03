/**
 * Created by Johan on 06/02/2015.
 */
var downloadsApp = angular.module('downloadsApp', ['ui.bootstrap', 'ngClipboard']);
//var downloadsApp = angular.module('downloadsApp', ['ui.bootstrap']);

downloadsApp.config(['ngClipProvider', function(ngClipProvider) { ngClipProvider.setPath("libs/zeroclipboard/ZeroClipboard.swf"); }]);

downloadsApp.controller('downloadsController', function ($scope, $filter, $http, $timeout, $location) {
    $scope.dirParam = getParameterByName('dir');

    $scope.sortRow = $scope.dirParam == "" ? 'modified' : 'name';
    $scope.sortReverse = $scope.dirParam == "";

    $scope.showDeleteIcon = false;
    $scope.showDlZipIcon = false;

    $scope.showBreadcrumbPopup = false;
    $scope.toggleShowBreadrumbPopup = function() {
        $scope.showBreadcrumbPopup = !$scope.showBreadcrumbPopup;
    };

    $scope.showModal = false;
    $scope.toggleModal = function(){
        $scope.showModal = !$scope.showModal;
    };

    $scope.showServerInfoModal = false;
    $scope.toggleServerInfoModal = function() {
        $scope.size = "";
        $scope.used = "";
        $scope.available = "";
        $scope.used_percent = "";

            $http.get('api/api.php', {
            params: {
                action: 'server_info'
            }
        }).success(function(data) {
            $scope.size = data.size;
            $scope.used = data.used;
            $scope.available = data.available;
            $scope.used_percent = data.used_percent;
        }).error(function() {

        });

        $scope.showServerInfoModal = !$scope.showServerInfoModal;
    };

    $scope.formatName = function(name, max) {
        if (name.length > max) {
            name = name.substr(0, max - 11) + "..." + name.substr(name.length - 8);
        }
        return name;
    };

    $scope.files = [];

    $scope.update = function() {
        $http.get('api/api.php', {
            params: {
                action: 'list_dir',
                dir: $scope.dirParam == "" ? 'content' : 'content/' + $scope.dirParam
            }
        }).success(function(data) {
            $scope.files = data;
            $scope.shouldShowManageIcons();
        }).error(function(data) {
            console.log("Error while getting list of files !");
            console.log(data);
        });
    };

    $scope.update();

    $scope.alert = {'type': 'alert-danger', 'msg': 'Le mot de passe est invalide !'};
    $scope.showAlert = false;

    $scope.closeAlert = function() {
        $scope.showAlert = false;
    };

    $scope.breadcrumbs = [];
    $scope.hiddenBreadcrumbs = [];
    $scope.currentFolder = {name: "Téléchargements"};

    $scope.checkBreadcrumbSize = function() {
        var size = $scope.currentFolder.prettyName ? $scope.currentFolder.prettyName.length : $scope.currentFolder.name.length;

        for (var i = 0; i < $scope.breadcrumbs.length; i++) {
            if ($scope.breadcrumbs[i].prettyName) {
                size += $scope.breadcrumbs[i].prettyName.length;
            } else {
                size += $scope.breadcrumbs[i].name.length;
            }
        }

        if (size > 60) {
            $scope.hiddenBreadcrumbs = $scope.breadcrumbs;
            $scope.breadcrumbs = [];
        } else {
            $scope.hiddenBreadcrumbs = [];
        }
    };

    $scope.generateBreadcrumb = function() {
        if ($scope.dirParam == "") return;
        var dirs = $scope.dirParam.split("/");
        for (var i = 0; i < dirs.length; i++) {
            if (i == 0) {
                $scope.breadcrumbs.push({path: "index.html", name: "Téléchargements"});
            }
            if (i == dirs.length -1) {
                break;
            }
            var path = i == 0 ?  "index.html?dir=" + encodeURIComponent(dirs[i]) : encodeURIComponent($scope.breadcrumbs[i].path + dirs[i]);
            var dir = {path: path, name: dirs[i]};
            if (dir.name.length > 20) {
                dir.prettyName =  $scope.formatName(dir.name, 20);
            }
            $scope.breadcrumbs.push(dir);
        }

        if (dirs.length > 0) {
            $scope.currentFolder = {name: dirs[dirs.length - 1]};
            if ($scope.currentFolder.name.length > 20) {
                $scope.currentFolder.prettyName = $scope.formatName($scope.currentFolder.name, 20);
            }
        }
        $scope.checkBreadcrumbSize();
    };

    $scope.generateBreadcrumb();

    $scope.copyToClipboard = function(file) {
        var absUrl = $location.absUrl();
        var url = absUrl.substr(0, absUrl.lastIndexOf("/") + 1);
        return url + $scope.formatURL(file);
    };

    $scope.toggleSelectLine = function(file) {
        //var file = $scope.getFileById(id);
        if (!file) return;
        file.selected = !file.selected;
        $scope.shouldShowManageIcons();
    };

    $scope.downloadDir = function(id) {
        var file = $scope.getFileById(id);

        if (file != null) {
            $scope.downloadAsTar([file]);
        }

        return false;
    };

    $scope.downloadSelectedAsTar = function() {
        var files = [];

        for (var i in $scope.files) {
            if ($scope.files[i].selected) {
                files.push($scope.files[i]);
            }
        }
        $scope.downloadAsTar(files);
    };

    $scope.downloadAsTar = function(files) {
        var tar_name = files.length == 1 ? files[0].name + ".tar" : "files.tar";
        var arr = [];

        for (var i = 0; i < files.length; i++) {
            arr.push(files[i].path + files[i].name);
        }

        open('POST', 'api/api.php', {
            'action': 'download_tar',
            'tar_name': tar_name,
            'files': arr
        }, '_blank');
    };

    $scope.deleteSelected = function() {
        var files = [];

        for (var i in $scope.files) {
            if ($scope.files[i].selected) {
                files.push($scope.files[i].path + $scope.files[i].name);
            }
        }

        var passwordDiv = $("#password");
        $http.post('api/api.php', {
            'action': 'delete',
            'files': files,
            'password': CryptoJS.MD5(passwordDiv.val()).toString()
        }).success(function() {
            for (var i = 0; i < $scope.files.length; i++) {
                if ($scope.files[i].selected) {
                    $scope.files.splice(i, 1);
                    i = -1;
                }
            }
            $scope.shouldShowManageIcons();
        }).error(function() {
            $scope.alert = {'type': 'danger', 'msg': 'Le mot de passe est invalide !'};
            $scope.showAlert = true;
            $('#alert').css('opacity', 1);
            $timeout(function() {
                $('#alert').animate({opacity: 0}, 1000);
            }, 2000);
            $timeout(function() {
                $scope.closeAlert();
            }, 3000);
        });
        passwordDiv.val("");
    };

    $scope.getFileById = function(id) {
        for (var i = 0; i < $scope.files.length; i++) {
            if ($scope.files[i].id == id)
                return $scope.files[i];
        }
        return null;
    };

    $scope.shouldShowManageIcons = function() {
        var nbrSelected = 0;
        $scope.files.forEach(function(file) {
            if (file.selected) {
                nbrSelected++;
            }
        });
        $scope.showDeleteIcon = nbrSelected > 0;
        $scope.showDlZipIcon = nbrSelected > 1;
    };

    $scope.sort = function(row) {
        $scope.sortReverse = $scope.sortRow == row && !$scope.sortReverse;
        $scope.sortRow = row;
    };

    $scope.formatDate = function(date) {
        var now = new Date().getTime();
        var fileDate = new Date(date);

        if ($filter('date')(now, 'longDate') == $filter('date')(fileDate, 'longDate')) {
            return $filter('date')(fileDate, "HH:mm");
        }
        return $filter('date')(fileDate, "dd/MM/yyyy HH:mm");
    };

    $scope.formatURL = function(file) {
        return file.type == "folder" ? "?dir="+encodeURIComponent(file.path.substr(String("content/").length) + file.name) : file.path + encodeURIComponent(file.name);
    };

    $scope.formatType = function(type) {
        switch ($scope.getIconForFileType(type)) {
            case 'icon-code':
                return 'code';
            case 'icon-compressed':
                return 'archive';
            case 'icon-executable':
                return 'programme';
            case 'icon-folder':
                return 'dossier';
            case 'icon-image':
                return 'image';
            case 'icon-music':
                return 'musique';
            case 'icon-txt':
                return 'texte';
            case 'icon-video':
                return 'vidéo';
            default:
                return 'fichier';
        }
    };
    $scope.getIconForFileType = function(type) {
        switch (type.toLowerCase()) {
            case 'js':
            case 'php':
            case 'html':
            case 'css':
                return 'icon-code';
            case 'zip':
            case 'rar':
            case '7z':
            case 'tar':
                return 'icon-compressed';
            case 'exe':
                return 'icon-executable';
            case 'folder':
                return 'icon-folder';
            case 'png':
            case 'jpg':
            case 'bmp':
            case 'tiff':
            case 'jpeg':
            case 'gif':
                return 'icon-image';
            case 'mp3':
            case 'wav':
            case 'riff':
            case 'bwf':
            case 'ogg':
            case 'aiff':
            case 'caf':
            case 'ac3':
            case 'wma':
                return 'icon-music';
            case 'txt':
            case 'doc':
            case 'docx':
                return 'icon-txt';
            case 'avi':
            case 'mp4':
            case 'wmv':
            case 'mov':
            case 'divx':
            case 'xvid':
            case 'mkv':
            case 'mka':
            case 'mkf':
            case 'h264':
            case 'mpeg4':
            case 'mpeg-4':
            case 'avc':
            case 'flv':
            case 'rmvb':
                return 'icon-video';
            default:
                return 'icon-file';
        }
    };
});

downloadsApp.directive('modal', function () {
    return {
        template: '<div class="modal fade">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title">{{ title }}</h4>' +
        '</div>' +
        '<div class="modal-body" ng-transclude></div>' +
        '</div>' +
        '</div>' +
        '</div>',
        restrict: 'E',
        transclude: true,
        replace:true,
        scope:true,
        link: function postLink(scope, element, attrs) {
            scope.title = attrs.title;

            scope.$watch(attrs.visible, function(value){
                if(value == true)
                    $(element).modal('show');
                else
                    $(element).modal('hide');
            });

            $(element).on('shown.bs.modal', function(){
                scope.$apply(function(){
                    scope.$parent[attrs.visible] = true;
                });
            });

            $(element).on('hidden.bs.modal', function(){
                scope.$apply(function(){
                    scope.$parent[attrs.visible] = false;
                });
            });
        }
    };
});