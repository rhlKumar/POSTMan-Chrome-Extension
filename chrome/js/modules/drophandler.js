pm.importFiles = {

 init: function(){

    zip.workerScriptsPath="./js/";
     //Check File API support
    if (window.File && window.FileList) {
        var drop_area = document.getElementById("drop_area");
        drop_area.addEventListener("dragover", pm.importFiles.dragHandler);

        drop_area.addEventListener("drop", pm.importFiles.filesDroped);

    }
    else {
        console.log("Your browser does not support File API");
    }
  },
  dragHandler:function (event) {
      event.stopPropagation();
      event.preventDefault();

  },

  filesDroped:function (event) {
      event.stopPropagation();
      event.preventDefault();

      String.prototype.endsWith = function(suffix) {
          return this.indexOf(suffix, this.length - suffix.length) !== -1;
      };


      var files = event.dataTransfer.files; //It returns a FileList object
      for (var i = 0; i < files.length; i++) {
      //file = files[i]
          if(files[i].name.endsWith(".saz")){
               zip.createReader(new zip.BlobReader(files[i].slice()),function(reader){reader.getEntries(function(zipContents){
                  var reader = new FileReader();
                  reader.onloadend = function(){pm.importFiles.processSazFiles(reader.result)};
                  if(zipContents.length>0){
                      zipContents.forEach(function(fileInZip){

                          if(fileInZip.filename.endsWith('_c.txt')){
                              var writer = new zip.BlobWriter();
                              fileInZip.getData(new zip.BlobWriter(),function(blob){
                              reader.readAsText(blob);

                  //I hate callbacks
              })}})}})}) }
           //TODO: check for conditions for file to qualify as wsdl file. ends with wsdl or asmx, what else?

           else if(true){
              var reader = new FileReader();
              reader.onloadend=function(){pm.importFiles.processWsdlFiles(reader.result)};
              reader.readAsText(files[i].slice());

           }
      }
  },

  // //dont know if there are other onload functions, should be combined with them.
  // window.onload = function() {

  //     //Check File API support
  //     if (window.File && window.FileList) {
  //         var drop_area = document.getElementById("drop_area");
  //         drop_area.addEventListener("dragover", dragHandler);

  //         drop_area.addEventListener("drop", filesDroped);

  //     }
  //     else {
  //         console.log("Your browser does not support File API");
  //     }
  // }

  processSazFiles :function(fileContent){
      var request = parser.parseRequest(fileContent);
      if (request.body) pm.history.addRequest(request.uri,request.method,request.headers, request.body,"raw")
          else pm.history.addRequest(request.uri,request.method,request.headers, request.body,"params")

  },

  processWsdlFiles : function(fileContent){
      var wsdl =new Wsdl();
      wsdl.text=fileContent;
      wsdl._parseWSDL()
      wsdl.generator=new XmlSampleGenerator(wsdl.targetNamespace, wsdl._getSchemas(), wsdl._getImports());

              $.each(wsdl.services, function() {
                  var service = this;
                  //TODO: what if different ports have different addresses. It still works because I am not replacing if the url does not
                  // exist in the url string. can be done in more elaborate way taking care of earch port.
                  var serviceUrl = service.ports[0].soap.address || service.ports[0].http.address;
                  pm.importFiles.addWsdlEnvironment(service.name.local,serviceUrl);
                  $.each(service.ports, function() {
                      var port = this;
                      var guid = window.guid();

                      pm.indexedDB.addCollection({"id":guid,"name":port.name.local}, function (collection) {

                      var binding = wsdl.bindings[port.binding.full];
                      if (binding) {
                          var portType = wsdl.portTypes[binding.type.full];

                          $.each(binding.operations, function() {
                              var operation = this;
                              var portTypeOperation = portType.operations[this.name.full];
                              var ctx = {
                                  wsdl: wsdl,
                                  generator: wsdl.generator,
                                  service: service,
                                  binding: binding,
                                  port: port,
                                  portType: portType,
                                  portTypeOperation: portTypeOperation,
                                  operation: operation
                              };

                              var request = window.Wsdl.generateRequest(ctx);
                              //postman variable for url.
                              request.url=request.url.replace(serviceUrl,"{{url}}");
                              var headerObject=request.headers;
                              request.headers="";
                              for(var prop in headerObject){request.headers=request.headers+prop+':'+headerObject[prop]+'\n'};
                              request.collectionId=guid;
                              request.data=request.body;
                              request.id=window.guid();
                              request.name=operation.name.local;
                              //TODO: choose context specific datamode
                              request.dataMode="raw";
                              request.timestamp=new window.Date().getTime();
                              pm.indexedDB.addCollectionRequest(request,function(){if(binding.operations.indexOf(operation)===binding.operations.length-1)pm.collections.render(collection);}); // render on last addition

                          });
                      }
                      });
                  });

                  //is there a better way to refresh collections?
                  pm.collections.getAllCollections();

              });
  },

  XmlSchemaPrimitives : {
    string: "Sample String",
    boolean: "true",
    decimal: "10.0",
    float: "1.0",
    double: "1.0",
    anyType: "anyType",
    byte: 'a',
    int: "1",
    long: "1",
    short: "1",
    unsignedByte: "1",
    unsignedInt: "1",
    unsignedLong: "1",
    unsignedShort: "1",
    duration: "0",
    dateTime: Date.now().toString(),
    time: "0",
    date: "0",
    gYearMonth: "0",
    gYear: "0",
    gMonthDay: "0",
    gDay: "0",
    gMonth: "0",
    hexBinary: "0",
    base64Binary: "0",
    anyURI: "www.phoneyurl.com",
    QName: "0",
    NOTATION: "0"
  },

  addWsdlEnvironment : function(serviceName, serviceUrl){
              var environment = {
              id:guid(),
              name:serviceName,
              timestamp:new Date().getTime()
          };
          var values = [];
          for (var pair in pm.importFiles.XmlSchemaPrimitives){
              values.push({"key":pair, "value":pm.importFiles.XmlSchemaPrimitives[pair]})
          }
          values.push({"key":"url","value":serviceUrl});
          environment.values=values;
          pm.indexedDB.environments.addEnvironment(environment, function () {
              pm.settings.set("selectedEnvironmentId", environment.id);
              pm.envManager.getAllEnvironments();
          });
    }

}