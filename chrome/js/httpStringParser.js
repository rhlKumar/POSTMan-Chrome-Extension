(function(obj) {
  var parseHeaders, parseRequest, parseRequestLine, parseResponse, parseStatusLine;

  parseRequest = function(requestString) {
    var headerLines, line, lines, parsedRequestLine, request;
    request = {};
    lines = requestString.split('\r\n');
    parsedRequestLine = parseRequestLine(lines.shift());
    request['method'] = parsedRequestLine['method'];
    request['uri'] = parsedRequestLine['uri'];
    headerLines = [];
    while (lines.length > 0) {
      line = lines.shift();
      if (line === "") {
        break;
      }
      headerLines.push(line);
    }
    request['headers'] = parseHeaders(headerLines);
    request['body'] = lines.join('\r\n');
    return request;
  };

  parseResponse = function(responseString) {
    var headerLines, line, lines, parsedStatusLine, response;
    response = {};
    lines = responseString.split('\r\n');
    parsedStatusLine = parseStatusLine(lines.shift());
    response['statusCode'] = parsedStatusLine['statusCode'];
    response['statusMessage'] = parsedStatusLine['statusMessage'];
    headerLines = [];
    while (lines.length > 0) {
      line = lines.shift();
      if (line === "") {
        break;
      }
      headerLines.push(line);
    }
    response['headers'] = parseHeaders(headerLines);
    response['body'] = lines.join('\r\n');
    return response;
  };

  parseHeaders = function(headerLines) {
    var headers, key, line, parts, _i, _len;
    headers = {};
    for (_i = 0, _len = headerLines.length; _i < _len; _i++) {
      line = headerLines[_i];
      parts = line.split(":");
      key = parts.shift();
      headers[key] = parts.join(":").trim();
    }
    return headers;
  };

  parseStatusLine = function(statusLine) {
    var parsed, parts;
    parts = statusLine.split(' ');
    parsed = {};
    parsed['protocol'] = parts[0];
    parsed['statusCode'] = parts[1];
    parsed['statusMessage'] = parts[2];
    return parsed;
  };

  parseRequestLine = function(requestLineString) {
    var parsed, parts;
    parts = requestLineString.split(' ');
    parsed = {};
    parsed['method'] = parts[0];
    parsed['uri'] = parts[1];
    parsed['protocol'] = parts[2];
    return parsed;
  };

  obj.parser ={parseRequest : parseRequest,

  parseResponse : parseResponse,

  parseRequestLine : parseRequestLine,

  parseStatusLine : parseStatusLine,

  parseHeaders : parseHeaders,
}

})(this);