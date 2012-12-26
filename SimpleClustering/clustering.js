$(document).ready(function() {
    var imageField = document.getElementById("picture");
    var ctx = imageField.getContext('2d');
    
    var pictures = [];
    var mouseFlag = false;
    
    ClearDrawingArea();
    
    $("#picture").mousedown( MouseDrawStart );
    $("#picture").mousemove( MouseDraw );
    $(document).mouseup( MouseDrawEnd );
    $("#clearButton").click( ClearDrawingArea );
    $("#addButton").click( AddPicture );
    $("#clusteringForm").submit( Clustering );
    $("#resetButton").click( ResetData );
    
    function MouseDrawStart( event )
    {
        mouseFlag = true;
        ctx.fillRect(event.offsetX, event.offsetY, 5, 5);
    }
    
    function MouseDraw( event )
    {
        if (mouseFlag) {
            ctx.fillRect(event.offsetX, event.offsetY, 5, 5);
        }
    }
    
    function MouseDrawEnd( event )
    {
        mouseFlag = false;
    }
    
    function ClearDrawingArea()
    {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, imageField.width, imageField.height);
        ctx.fillStyle = "black";
    }
    
    function AddPicture( )
    {
        pictures.push(imageField.toDataURL() );
        ClearDrawingArea();
    }
    
    function ResetData( )
    {
        pictures = [];
        ClearDrawingArea();
        $("#stepNumber").val("");
        $("#outputDiv").text("");
    }
    
    function MakingPixelMap( pict )
    {
        var map = [];
        var CNV = document.getElementById('testCanvas');
        var CNVctx = CNV.getContext('2d');
        var image = new Image();
        image.src = pict;
        CNVctx.drawImage(image, 0, 0);
        var pixelMap = CNVctx.getImageData(0, 0, CNV.width, CNV.height).data;
        for (var i=0; i < pixelMap.length; i+=4) {
            if (pixelMap[i] == 255 && pixelMap[i+1] == 255 && pixelMap[i+2] == 255) { 
                map.push(0);
            } else {
                map.push(1);
            }   
        }
        return map;
    }
    
    function CreateCluster( pict )
    {
        var pixelMap = MakingPixelMap( pict );
        return {center: pixelMap,
            points: [ {src: pict, map: pixelMap} ]
        };
    }
    
    function Clustering( )
    {
        try {
            $("#outputDiv").text("");
            var num = $("#numberOfClusters").val();
            var clusterList;
            var closestCluster;
            var currPict;
            var distances = [];
            if (num > pictures.length) {
                return;
            }
            clusterList = [ CreateCluster(pictures[0]) ];
            for (var i=1; i< pictures.length; i++) {
                currPict = {src: pictures[i], map: MakingPixelMap(pictures[i]) };
                $.each( clusterList, function( index, cluster) {
                    distances[index] = EuclideanDistance(currPict["map"], 
                        cluster["center"]);
                });
                closestCluster = FindMin( distances, num );
                    if (closestCluster == undefined ) {
                        clusterList.push( CreateCluster(pictures[i]) );
                    }
            }
            while (moveFlag) { //Написать условие!!!
                moveFlag = false;
                clusterCenters = CountCenters( clusterList );
                newClusterList = [];
                $.each( clusterList, function(clusterNum, cluster)
                {
                    $.each(cluster, function(index, pict)
                    {
                        for (var i=0; i< clusterCenters.length; i++ ) {
                            distances[i] = EuclideanDistance(pict["map"], clusterCenters[i]);
                        }
                        closestCluster = FindMin( distances );
                        if ( closestCluster != clusterNum ) {
                            moveFlag = true;
                        }
                        if (newClusterList[closestCluster] == undefined) {
                            newClusterList[closestCluster] = [];
                        }
                        newClusterList[closestCluster].push( pict );
                    });
                }); 
                clusterList = newClusterList;
            }
            ShowPictures( clusterList );
        }
        catch (err) {
            console.log( err );
            console.log( err.message );
            console.log( err.stack );
        }
        return false;
    }
    
    function ShowPictures( clusters )
    {
        $.each(clusters, function( index, clstr)
        {
            $("#outputDiv").append( index );
            $.each( clstr, function(num,picture)
            {
                $("#outputDiv").append("<img src="+picture["src"]+
                    " class=drawing-area>");
            })
        });
    }
    
    function FindMin( distance, step )
    {
        var min = distance[0];
        var num = 0;
        for (var i=1; i<distance.length; i++) {
            if (distance[i] < min ) {
                min = distance[i];
                num = i;
            }
        }
        if (min > step) {
            return undefined;
        } else return num;
    }
    
    function EuclideanDistance( map1, map2 )
    {
        var sum = 0;
        for( var i=0; i<map1.length; i++) {
            sum+= Math.pow(map1[i]-map2[i], 2);
        }
        return Math.sqrt(sum);
    }
    
    function CountCenters ( clusters )
    {
        console.log( clusters );
        try {
            var centers = [];
            $.each( clusters , function(clusterNum, cluster)
            {
                var cntr = [];
                var pictureLength = imageField.height * imageField.width;
                for ( var i=0; i<pictureLength; i++ ) {
                    cntr.push(0);
                }
                $.each( cluster, function(index, pict)
                {
                    for (var i=0; i< pictureLength; i++) {
                        cntr[i] += pict["map"][i];
                    }
                });
                for (var i=0; i<pictureLength; i++ )
                    cntr[i] /= cluster.length;
                centers[clusterNum] = cntr;
            });
            return centers;
        }
        catch ( err ) {
            console.log( err );
            console.log( err.message );
            console.log( err.stack );
        }
    }
    
    function CreateClusterParts( num )
    {
        var clusters = [];
        var clstr = {};
        for (var i=0; i < pictures.length; i++) {
            clstr = clusters[ i % num ];
            if (clstr == undefined) {
                clstr = [];
            }
            clstr.push( {
                src:pictures[i], 
                map:MakingPixelMap( pictures[i] )
            } );
            clusters[ i % num ] = clstr;
        }
        return clusters;
    }
}
);
