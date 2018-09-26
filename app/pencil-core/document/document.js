function PencilDocument() {
    initDocument(this);
}

// @todo create initPencilDocument error message
function initDocument(doc){
    if (!doc) throw Util.getMessage("attempting.to.construct.a.page.outside.the.scope.of.a.valid.document");

    doc.properties = {};
    doc.pages = [];
    doc.documents = [];
}

PencilDocument.prototype.toDom = function () {

    var dom = Controller.parser.parseFromString("<Document xmlns=\"" + PencilNamespaces.p + "\"></Document>", "text/xml");

    //properties
    PropertiestoDom(this, dom);

    //pages
    PagestoDom(this, dom);

    //documents
    DocumentstoDom(this, dom);

    return dom;
};

// @TODO add error message
function PropertiestoDom (doc, dom){
    if (!doc) throw Util.getMessage("attempting.to.construct.a.page.outside.the.scope.of.a.valid.document");

    //properties
    var propertyContainerNode = dom.createElementNS(PencilNamespaces.p, "Properties");
    dom.documentElement.appendChild(propertyContainerNode);

    for (name in doc.properties) {
        var propertyNode = dom.createElementNS(PencilNamespaces.p, "Property");
        propertyContainerNode.appendChild(propertyNode);

        propertyNode.setAttribute("name", name);
        propertyNode.appendChild(dom.createTextNode(doc.properties[name].toString()));
    }

}

PencilDocument.prototype.addPage = function (page) {
    this.pages[this.pages.length] = page;
};

PencilDocument.prototype.getPageById = function (id) {
    for (var i in this.pages) {
        if (this.pages[i].properties.id == id) return this.pages[i];
    }

    return null;
};

PencilDocument.prototype.getPageByFid = function (fid) {
    for (var i in this.pages) {
        if (this.pages[i].properties.fid == fid) return this.pages[i];
    }

    return null;
};
PencilDocument.prototype.getFirstPageByName = function (name) {
    for (var i in this.pages) {
        if (this.pages[i].properties.name == name) return this.pages[i];
    }

    return null;
};

addDocumentFunction =  function (document) {
    this.documents[this.documents.length] = document;
};

PencilDocument.prototype.addDocument = addDocumentFunction;


getDocumentByIdFunction = function (id) {
    for (var i in this.documents) {
        if (this.documents[i].properties.id == id) return this.documents[i];
    }

    return null;
};


PencilDocument.prototype.getDocumentById = getDocumentByIdFunction;


function Page(doc) {
    if (!doc) throw Util.getMessage("attempting.to.construct.a.page.outside.the.scope.of.a.valid.document");
    // this.doc = doc;
    // this.properties = {};
    // this.contentNode = null;
    // this.bg = {
    //     lastId: null,
    //     lastUpdateTimestamp: 0
    // };
    // this.rasterizeCache = null;
    this.children = [];
}

// @TODO add error message
function PagestoDom(doc, dom) {
    if (!doc) throw Util.getMessage("attempting.to.construct.a.page.outside.the.scope.of.a.valid.document");

    //pages
    var pageContainerNode = dom.createElementNS(PencilNamespaces.p, "Pages");
    dom.documentElement.appendChild(pageContainerNode);

    for (i in doc.pages) {
        var pageNode = dom.createElementNS(PencilNamespaces.p, "Page");
        pageContainerNode.appendChild(pageNode);

        pageNode.setAttribute("href", doc.pages[i].pageFileName);
    }

}

Page.PROPERTIES = ["id", "fid", "name", "width", "height", "backgroundPageId", "backgroundColor", "note", "pageFileName", "parentPageId", "scrollTop", "scrollLeft", "zoom"];
Page.PROPERTY_MAP = {
    "id": "id",
    "fid": "fid",
    "name": "name",
    "width": "width",
    "height": "height",
    "background": "backgroundPageId",
    "backgroundColor": "backgroundColor",
    "scrollTop": "scrollTop",
    "scrollLeft": "scrollLeft",
    "zoom": "zoom"
};

Page.prototype.toXml = function () {
    var dom = Controller.parser.parseFromString("<p:Page xmlns:p=\"" + PencilNamespaces.p + "\"></p:Page>", "text/xml");
    var propertyContainerNode = dom.createElementNS(PencilNamespaces.p, "p:Properties");
    dom.documentElement.appendChild(propertyContainerNode);

    for (name in Page.PROPERTIES) {
        if (!page[name]) continue;

        var propertyNode = dom.createElementNS(PencilNamespaces.p, "p:Property");
        propertyContainerNode.appendChild(propertyNode);

        propertyNode.setAttribute("name", name);
        propertyNode.appendChild(dom.createTextNode(page[name].toString()));
    }

    var content = dom.createElementNS(PencilNamespaces.p, "p:Content");
    dom.documentElement.appendChild(content);

    if (page.canvas) {
        var node = dom.importNode(page.canvas.drawingLayer, true);
        while (node.hasChildNodes()) {
            var c = node.firstChild;
            node.removeChild(c);
            content.appendChild(c);
        }
    }

    return Controller.serializer.serializeToString(dom);
};

Page.prototype.equals = function (page) {
    if (page == null) return false;
    return page.constructor == Page && page.id == this.id;
};
Page.prototype.getBackgroundPage = function () {
    // var bgPageId = this.properties.background;
    // if (!bgPageId) return null;
    // return this.doc.getPageById(bgPageId);

    if (this.backgroundPage) return this.backgroundPage;
    if (this.backgroundPageId) return Pencil.controller.getPageById(this.backgroundPageId);
    return null;
};

Page._validateBackgroundInternal = function (list, page) {
    var newList = [];
    for (var i in list) {
        var p = list[i];
        if (p.equals(page)) throw Util.getMessage("cyclic.ref.found.in.background.settings");
        newList.push(p);
    }
    var nextBg = page.getBackgroundPage();
    if (nextBg) {
        newList.push(page);
        Page._validateBackgroundInternal(newList, nextBg);
    }
};
Page.prototype.validateBackgroundSetting = function () {
    var page = this.getBackgroundPage();
    if (!page) return;

    Page._validateBackgroundInternal([this], page);
};
Page.prototype.canSetBackgroundTo = function (page) {
    try {
        Page._validateBackgroundInternal([this], page);
        return true;
    } catch (e) { return false; }
};

Page.prototype.isBackgroundValid = function () {
    var page = this.getBackgroundPage();
    if (!page) return (this.bgToken ? false : true);
    if (!page.isRasterizeDataCacheValid()) return false;
    if (!page.rasterizeDataCache || (page.rasterizeDataCache.token != this.bgToken)) return false;

    return true;
};

Page.prototype.ensureBackground = function (callback) { // callback: function() {} called when done
//    alert("ensureBackground() for " + this.properties.name);
    if (Config.get("object.snapping.background") == null) {
        Config.set("object.snapping.background", true);
    }

    this.canvas.snappingHelper.updateSnappingDataFromBackground(this.getBackgroundPage(), Config.get("object.snapping.background") == false);
    // this._view.canvas.setDimBackground(this.properties.dimBackground);
    this.rasterizeDataCache = null;

    var page = this.getBackgroundPage();
    if (!page) {
        this.bgToken = null;
        this.canvas.setBackgroundImageData(null);

        if (callback) callback();
        return;
    }
    var thiz = this;
    //alert("ensureBackground(), use bit map of " + page.properties.name  + " as bg for " + this.properties.name);
    page.getRasterizeData(function (rasterizeData) {
        thiz.bgToken = rasterizeData.token;
        //alert([page.properties.name, rasterizeData.image.width, rasterizeData.image.height]);
        try {
            thiz.canvas.setBackgroundImageData(rasterizeData.image, false);
        } catch (e) {
            Console.dumpError(e);
        }

        if (callback) callback();
    });
};
Page.prototype.getRasterizeData = function (callback) {
    if (this.isRasterizeDataCacheValid()) {
        callback(this.rasterizeDataCache);

        return;
    }
    var thiz = this;
    this.ensureBackground(function () {
        //alert("rasterizing page: " + thiz.properties.name);
        Pencil.rasterizer.rasterizePageToUrl(thiz, function (imageData) {
            thiz.rasterizeDataCache = {
                token: thiz._generateToken(),
                image: imageData
            };
            callback(thiz.rasterizeDataCache);
        });
    });
};
Page.prototype.isRasterizeDataCacheValid = function () {
    return this.rasterizeDataCache && this.isBackgroundValid();
};
Page.prototype._generateToken = function () {
    return this.id + "@" + (new Date().getTime()) + "_" + Math.round(Math.random() * 1000);
};
Page.prototype.generateFriendlyId = function (usedFriendlyIds) {
    var baseName = this.name.replace(/[^a-z0-9 ]+/gi, "").replace(/[ ]+/g, "_").toLowerCase();
    var name = baseName;
    var seed = 1;

    while (usedFriendlyIds.indexOf(name) >= 0) {
        name = baseName + "_" + (seed ++);
    }

    usedFriendlyIds.push(name);
    return name;
};


// @TODO implement  Documents
// @TODO create error message
function Document(doc) {
    if (!doc) throw Util.getMessage("attempting.to.construct.a.page.outside.the.scope.of.a.valid.document");
    
    initDocument(doc);

    // this.doc = doc;
    // this.properties = {};
    // this.contentNode = null;
    // this.bg = {
    //     lastId: null,
    //     lastUpdateTimestamp: 0
    // };
    // this.rasterizeCache = null;
    this.children = [];
}

// @TODO add error message
function DocumentstoDom(doc, dom) {
    if (!doc) throw Util.getMessage("attempting.to.construct.a.page.outside.the.scope.of.a.valid.document");

    //documents
    var includeDocumentContainerNode = dom.createElementNS(PencilNamespaces.p, "Documents");
    dom.documentElement.appendChild(includeDocumentContainerNode);

    for (includeDocument in doc.documents) {
        var inclDocNode = dom.createElementNS(PencilNamespaces.p, "Document");
        includeDocumentContainerNode.appendChild(inclDocNode);

        //properties
        PropertiestoDom(doc, inclDocNode);

        //pages
        PagestoDom(doc, inclDocNode);

        //documents
        DocumentstoDom(doc, inclDocNode);
    }

}

Document.PROPERTIES = ["id", "fid", "name", "description", "createDate", "importDate"];
Document.PROPERTY_MAP = {
    "id": "id",
    "fid": "fid",
    "name": "name",
    "description": "description",
    "createDate": "createDate",
    "importDate": "importDate"
};

Document.prototype.addDocument = addDocumentFunction ;

Document.prototype.getDocumentById = getDocumentByIdFunction;

