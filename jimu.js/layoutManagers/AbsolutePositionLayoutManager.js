///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
var VerGestion;
var global_id_sia_general = null;
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/topic',
  'dojo/dom-construct',
  'dojo/dom-geometry',
  'dojo/promise/all',
  'dojo/when',
  '../WidgetManager',
  '../PanelManager',
  '../utils',
  '../dijit/LoadingShelter',
  './BaseLayoutManager',
  'esri/InfoTemplate'
],

function(declare, lang, array, html, topic, domConstruct, domGeometry,
  all, when, WidgetManager, PanelManager, utils, LoadingShelter, BaseLayoutManager, InfoTemplate) {
  /* global jimuConfig:true */
  var instance = null, clazz;

  clazz = declare([BaseLayoutManager], {
    name: 'AbsolutePositionLayoutManager',

    constructor: function() {
      /*jshint unused: false*/
      this.widgetManager = WidgetManager.getInstance();
      this.panelManager = PanelManager.getInstance();

      topic.subscribe("changeMapPosition", lang.hitch(this, this.onChangeMapPosition));

      this.onScreenGroupPanels = [];
    },

    map: null,

    resize: function() {
      //resize widgets. the panel's resize is called by the panel manager.
      //widgets which is in panel is resized by panel
      array.forEach(this.widgetManager.getAllWidgets(), function(w) {
        if (w.inPanel === false) {
          w.resize();
        }
      }, this);
    },

    setMap: function(map){
      this.inherited(arguments);
      this.panelManager.setMap(map);
    },

    getMapDiv: function(){
      if(html.byId(this.mapId)){
        return html.byId(this.mapId);
      }else{
        return html.create('div', {
          id: this.mapId,
          style: lang.mixin({
            position: 'absolute',
            backgroundColor: '#EEEEEE',
            overflow: 'hidden',
            minWidth:'1px',
            minHeight:'1px'
          }, utils.getPositionStyle(this.appConfig.map.position))
        }, this.layoutId);
      }
    },

    loadAndLayout: function(appConfig){
      console.time('Load widgetOnScreen acaa');
      this.setMapPosition(appConfig.map.position);

      var loading = new LoadingShelter(), defs = [];
      loading.placeAt(this.layoutId);
      loading.startup();

      this._setTabindex(appConfig, false);
      // topic.publish('tabIndexChanged', appConfig);//this line will change this.appConfig

      //load widgets
      defs.push(this.loadOnScreenWidgets(appConfig));

      //load groups
      array.forEach(appConfig.widgetOnScreen.groups, function(groupConfig) {
        defs.push(this._loadOnScreenGroup(groupConfig, appConfig));
      }, this);

      all(defs).then(lang.hitch(this, function(){
        if(loading){
          loading.destroy();
          loading = null;
        }
        console.timeEnd('Load widgetOnScreen sss');
        topic.publish('preloadWidgetsLoaded');
        console.log('map: ', this.map);
        var gLayer = this.map.getLayer('INCO_SIAS_WGS84_5038');
        VerGestion = this._onclickVerGestion;
        var htmlInfoTemplate = this.getHtmlInfotemplate();
        var infoTemplate = new InfoTemplate("SIA", htmlInfoTemplate);  
        gLayer.setInfoTemplate(infoTemplate);
        console.log('gLayer: ', gLayer);
        // "INCO_SIAS_WGS84_5038"
      }), lang.hitch(this, function(){
        if(loading){
          loading.destroy();
          loading = null;
        }
        //if error when load widget, let the others continue
        console.timeEnd('Load widgetOnScreen www');
        topic.publish('preloadWidgetsLoaded');
      }));
    },

    getHtmlInfotemplate: function () {
      let html_infotemplate = "";
      html_infotemplate += "<table class='table table-sm'>";
      html_infotemplate += "<tbody><tr><td>ID SIA General:</td><td>${SIAs_Areas_SIA_ID_Gral}</td></tr>";
      html_infotemplate += "<tr><td>EPC:</td><td>${Dat_SIAs_SIA_EPC}</td></tr>";
      html_infotemplate += "<tr><td>Area solicitada:</td><td>${Dat_SIAs_Area_Solicitada}</td></tr>";
      html_infotemplate += "<tr><td>Fecha solicitud:</td><td>${Dat_SIAs_Fecha_Solicitud}</td></tr>";
      html_infotemplate += "<tr><td>Estado gestión:</td><td>${Dat_SIAs_Estados_Gestion}</td></tr>";
      html_infotemplate += "<tr><td>Comentario:</td><td>${Dat_SIAs_Comentario}</td></tr>";
      html_infotemplate += "<tr><td>SIA Origen:</td><td>${Dat_SIAs_SIA_Origen}</td></tr>";
      html_infotemplate += "<tr><td colspan='2'>";
      html_infotemplate += "<input type='button' id='botonVerGestion' class='btn btn-primary btn-sm' value='Ver gestión' onclick='VerGestion("+'"'+"${SIAs_Areas_SIA_ID_Gral}|${OBJECTID}"+'"'+");'>";
      html_infotemplate += "</td></tr></tbody></table>";
      return html_infotemplate;
    },

    _onclickVerGestion: function (data) {
      var aux = data.split("|");
      global_id_sia_general = aux[0];
      console.log('_onclickVerGestion global_id_sia_general: ', global_id_sia_general);
      $("#dijit__WidgetBase_1").click();
      // var panelIsVisible = $("#_35_panel").is(":visible");
      // console.log('_onclickVerGestion panelIsVisible: ', panelIsVisible);

      // if(panelIsVisible)
      // {
      //   $("#sel-nota-gestion-sia").val(id_sia_general)
      //   $("#sel-nota-gestion-sia").change();
      // }else{
      //   $("#dijit__WidgetBase_1").click();
      //   const timeValue = setInterval((interval) => {
      //     console.log('acaaa');
      //     console.log($("#_35_panel").is(":visible"));
      //     if($("#_35_panel").is(":visible"))
      //     {
      //       $("#sel-nota-gestion-sia").val(id_sia_general)
      //       $("#sel-nota-gestion-sia").change();
      //       clearInterval(timeValue);
      //     }
      //   }, 1000); //Cada medio segundos
      // }

      // $(".esriPopup").removeClass("esriPopupVisible").addClass("esriPopupHidden");
      // $(".esriPopup").css({ 'z-index': -40 });
    },

    destroyOnScreenWidgetsAndGroups: function(){
      this.panelManager.destroyAllPanels();
      this.destroyOnScreenOffPanelWidgets();
      this.destroyWidgetPlaceholders();
      this.destroyOnScreenWidgetIcons();
      //the panels have been destroyed by panelManager, so just clean array after switch theme.
      this.onScreenGroupPanels = [];
      //reset sideBar class from layoutContainer
      html.removeClass(this.map.container.parentNode, 'sideBarDisplay');
      html.removeClass(this.map.container.parentNode, 'sideBarHidden');
    },

    ///seems this function is not used any more, leave it here for backward compatibility.
    openWidget: function(widgetId){
      //if widget is in group, we just ignore it

      //check on screen widgets, we don't check not-closeable off-panel widget
      array.forEach(this.onScreenWidgetIcons, function(widgetIcon){
        if(widgetIcon.configId === widgetId){
          widgetIcon.switchToOpen();
        }
      }, this);

      //check controllers
      array.forEach(this.widgetManager.getControllerWidgets(), function(controllerWidget){
        if(controllerWidget.widgetIsControlled(widgetId)){
          controllerWidget.setOpenedIds([widgetId]);
        }
      }, this);
    },

    /////////////functions to handle builder events
    onLayoutChange: function(appConfig){
      this._changeMapPosition(appConfig);

      //relayout placehoder
      array.forEach(this.widgetPlaceholders, function(placeholder){
        placeholder.moveTo(appConfig.getConfigElementById(placeholder.configId).position);
      }, this);

      //relayout icons
      array.forEach(this.onScreenWidgetIcons, function(icon){
        icon.moveTo(appConfig.getConfigElementById(icon.configId).position);
      }, this);

      //relayout paneless widget
      array.forEach(this.widgetManager.getOnScreenOffPanelWidgets(), function(widget){
        if(widget.closeable){
          //this widget position is controlled by icon
          return;
        }
        var position = appConfig.getConfigElementById(widget.id).position;
        widget.setPosition(position);
      }, this);

      //relayout groups
      array.forEach(this.onScreenGroupPanels, function(panel){
        var position = appConfig.getConfigElementById(panel.config.id).panel.position;
        panel.setPosition(position);
      }, this);
    },

    onWidgetChange: function(appConfig, widgetConfig){
      widgetConfig = appConfig.getConfigElementById(widgetConfig.id);

      this.onOnScreenWidgetChange(appConfig, widgetConfig);

      array.forEach(this.onScreenGroupPanels, function(panel){
        panel.reloadWidget(widgetConfig);
      }, this);

    },

    onGroupChange: function(appConfig, groupConfig){
      groupConfig = appConfig.getConfigElementById(groupConfig.id);

      if(groupConfig.isOnScreen){
        //for now, onscreen group can change widgets in it only
        this.panelManager.destroyPanel(groupConfig.id + '_panel');
        this.removeDestroyed(this.onScreenGroupPanels);
        this._loadOnScreenGroup(groupConfig, appConfig);
      }else{
        array.forEach(this.widgetManager.getControllerWidgets(), function(controllerWidget){
          if(controllerWidget.isControlled(groupConfig.id)){
            this.reloadControllerWidget(appConfig, controllerWidget.id);
          }
        }, this);

        array.forEach(this.panelManager.panels, function(panel){
          if(panel.config.id === groupConfig.id){
            panel.updateConfig(groupConfig);
          }
        }, this);
      }
    },

    onActionTriggered: function(info){
      if(info.action === 'highLight'){
        array.forEach(this.widgetPlaceholders, function(placehoder){
          if(placehoder.configId === info.elementId){
            this._highLight(placehoder);
          }
        }, this);
        array.forEach(this.onScreenWidgetIcons, function(widgetIcon){
          if (widgetIcon.configId === info.elementId){
            this._highLight(widgetIcon);
          }
        }, this);
        array.forEach(this.widgetManager.getOnScreenOffPanelWidgets(), function(panelessWidget){
          if (panelessWidget.configId === info.elementId){
            this._highLight(panelessWidget);
          }
        }, this);
        array.forEach(this.onScreenGroupPanels, function(panel){
          if (panel.configId === info.elementId){
            this._highLight(panel);
          }
        }, this);
      }
      if(info.action === 'removeHighLight'){
        this._removeHighLight();
      }
      if(info.action === 'showLoading'){
        html.setStyle(jimuConfig.loadingId, 'display', 'block');
        html.setStyle(jimuConfig.mainPageId, 'display', 'none');
      }
      if(info.action === 'showApp'){
        html.setStyle(jimuConfig.loadingId, 'display', 'none');
        html.setStyle(jimuConfig.mainPageId, 'display', 'block');
      }
    },

    onChangeMapPosition: function(position) {
      var pos = lang.clone(this.mapPosition);
      lang.mixin(pos, position);
      this.setMapPosition(pos);
    },

    setMapPosition: function(position){
      this.mapPosition = position;

      var posStyle = utils.getPositionStyle(position);
      html.setStyle(this.mapId, posStyle);
      if (this.map && this.map.resize) {
        this.map.resize();
      }
    },

    getMapPosition: function(){
      return this.mapPosition;
    },

    _highLight: function(dijit){
      if(!dijit.domNode){
        //the dijit may be destroyed
        return;
      }
      if (this.hlDiv){
        this._removeHighLight(dijit);
      }
      var position = domGeometry.getContentBox(dijit.domNode);
      var hlStyle = {
        position: 'absolute',
        left: position.l + 'px',
        top: position.t + 'px',
        width: position.w + 'px',
        height: position.h + 'px'
      };
      this.hlDiv = domConstruct.create('div', {
        "style": hlStyle,
        "class": 'icon-highlight'
      }, dijit.domNode, 'before');
    },

    _removeHighLight: function(){
      if (this.hlDiv){
        domConstruct.destroy(this.hlDiv);
        this.hlDiv = null;
      }
    },

    _changeMapPosition: function(appConfig){
      if(!this.map){
        return;
      }
      if(!utils.isEqual(this.getMapPosition(), appConfig.map.position)){
        this.setMapPosition(appConfig.map.position);
      }
    },

    _loadOnScreenGroup: function(groupJson, appConfig) {
      if(!appConfig.mode && (!groupJson.widgets || groupJson.widgets.length === 0)){
        html.addClass(this.map.container.parentNode, 'sideBarHidden');
        return when(null);
      }
      return this.panelManager.showPanel(groupJson).then(lang.hitch(this, function(panel){
        panel.configId = groupJson.id;
        this.onScreenGroupPanels.push(panel);
        return panel;
      }));
    }
  });

  clazz.getInstance = function() {
    if (instance === null) {
      instance = new clazz();
      window._absolutLayoutManager = instance;
    }
    return instance;
  };
  return clazz;
});
