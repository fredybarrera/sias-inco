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
var userToken = null;
var userPortal = null;
var tabla = null;
var appConfig, getRequest, postRequest, showMessage, getProfesionales;
define([
  'dojo/_base/declare', 
  "jimu/dijit/Message",
  "dojo/Deferred",
  "dojo/_base/lang",
	"dojo/_base/array",
  'jimu/BaseWidget',
  'dijit/Dialog',
  'jimu/portalUtils',
  'jimu/portalUrlUtils',
  "dojo/dom", 
  "dojo/on", 
  'esri/tasks/query',
	'esri/tasks/QueryTask',
  "dojo/query!css2", 
  "dojo/domReady!"
],
function(
  declare, 
  Message,
  Deferred,
  lang,
	arrayUtils, 
  BaseWidget,
  Dialog,
  portalUtils, 
  portalUrlUtils,
  dom, 
  on, 
  Query,
	QueryTask,
  ){
  var myDialog;

  guardar = function () {
    if(tabla === 'profesionales')
    {
      getDataProfesional().then(
        lang.hitch(this, function(data) { 
          var strData = JSON.stringify([data])
          postRequest(appConfig.Sias.urlBase + appConfig.Sias.urlKeyProfesionales + '/applyEdits', strData, 'adds').then(
            lang.hitch(this, function(response) { 
              if (response.addResults[0].success === true)
              {
                getProfesionales();
                showMessage('Profesional creado exitosamente');
                myDialog.hide();
              } else {
                msg = response.addResults[0].error.description
                showMessage('Error al enviar la información: ' + msg, 'error')
              }
            }),
            function(objErr) {
              showMessage('Error al enviar la información: ' + objErr, 'error')
              console.log('request failed', objErr);
            }
          );
        }),
        lang.hitch(this, function(strError) {
          console.log('request failed', strError);
          $("#alert-crear-profesional").html(strError).show()
        })
      );

    } else if (tabla === 'solicitantes') {

      getDataSolicitante().then(
        lang.hitch(this, function(data) { 
          console.log('data: ', data);
          var strData = JSON.stringify([data])
          postRequest(appConfig.Sias.urlBase + appConfig.Sias.urlKeySolicitante + '/applyEdits', strData, 'adds').then(
            lang.hitch(this, function(response) { 
              if (response.addResults[0].success === true)
              {
                getSolicitantes();
                showMessage('Solicitante creado exitosamente');
                myDialog.hide();
              } else {
                msg = response.addResults[0].error.description
                showMessage('Error al enviar la información: ' + msg, 'error')
              }
            }),
            function(objErr) {
              showMessage('Error al enviar la información: ' + objErr, 'error')
              console.log('request failed', objErr);
            }
          );
        }),
        lang.hitch(this, function(strError) {
          console.log('request failed', strError);
          showMessage(strError, 'error')
        })
      );

    } else if (tabla === 'estados') {
      getDataEstado().then(
        lang.hitch(this, function(data) { 
          console.log('data: ', data);
          var strData = JSON.stringify([data])
          postRequest(appConfig.Sias.urlBase + appConfig.Sias.urlKeyEstadoGestion + '/applyEdits', strData, 'adds').then(
            lang.hitch(this, function(response) { 
              if (response.addResults[0].success === true)
              {
                getEstadosGestion();
                showMessage('Estado creado exitosamente');
                myDialog.hide();
              } else {
                msg = response.addResults[0].error.description
                showMessage('Error al enviar la información: ' + msg, 'error')
              }
            }),
            function(objErr) {
              showMessage('Error al enviar la información: ' + objErr, 'error')
              console.log('request failed', objErr);
            }
          );
        }),
        lang.hitch(this, function(strError) {
          console.log('request failed', strError);
          $("#alert-crear-estado").html(strError).show();
        })
      );
    }
  };

  actualizar = function () {
    if(tabla === 'profesionales')
    {
      getDataProfesional().then(
        lang.hitch(this, function(data) { 
          var strData = JSON.stringify([data])
          postRequest(appConfig.Sias.urlBase + appConfig.Sias.urlKeyProfesionales + '/updateFeatures', strData, 'features').then(
            lang.hitch(this, function(response) { 
              if (response.updateResults[0].success === true)
              {
                getProfesionales();
                showMessage('Profesional actualizado exitosamente');
                myDialog.hide();
              } else {
                msg = response.updateResults[0].error.description
                showMessage('Error al enviar la información: ' + msg, 'error')
              }
            }),
            function(objErr) {
              showMessage('Error al enviar la información: ' + objErr, 'error')
              console.log('request failed', objErr);
            }
          );
        }),
        lang.hitch(this, function(strError) {
          console.log('request failed', strError);
          $("#alert-edit-profesional").text(strError).show();
        })
      );
      
    } else if (tabla === 'solicitantes') {

      getDataSolicitante().then(
        lang.hitch(this, function(data) { 
          console.log('data: ', data);
          var strData = JSON.stringify([data])
          postRequest(appConfig.Sias.urlBase + appConfig.Sias.urlKeySolicitante + '/updateFeatures', strData, 'features').then(
            lang.hitch(this, function(response) { 
              if (response.updateResults[0].success === true)
              {
                getSolicitantes();
                showMessage('Solicitante actualizado exitosamente');
                myDialog.hide();
              } else {
                msg = response.updateResults[0].error.description
                showMessage('Error al enviar la información: ' + msg, 'error')
              }
            }),
            function(objErr) {
              showMessage('Error al enviar la información: ' + objErr, 'error')
              console.log('request failed', objErr);
            }
          );
        }),
        lang.hitch(this, function(strError) {
          console.log('request failed', strError);
          showMessage(strError, 'error')
        })
      );

    } else if (tabla === 'estados') {

      getDataEstado().then(
        lang.hitch(this, function(data) { 
          console.log('data: ', data);
          var strData = JSON.stringify([data])
          postRequest(appConfig.Sias.urlBase + appConfig.Sias.urlKeyEstadoGestion + '/updateFeatures', strData, 'features').then(
            lang.hitch(this, function(response) { 
              if (response.updateResults[0].success === true)
              {
                getEstadosGestion();
                showMessage('Estado actualizado exitosamente');
                myDialog.hide();
              } else {
                msg = response.updateResults[0].error.description
                showMessage('Error al enviar la información: ' + msg, 'error')
              }
            }),
            function(objErr) {
              showMessage('Error al enviar la información: ' + objErr, 'error')
              console.log('request failed', objErr);
            }
          );
        }),
        lang.hitch(this, function(strError) {
          console.log('request failed', strError);
          $("#alert-edit-estado").html(strError).show();
        })
      );
    }
  };

  cancel = function () {
    myDialog.hide();
  };

  getDataProfesional = function () {
    var deferred = new Deferred();
    var data = {};
    var attributes = {};
    var areas = [];

    $("#alert-edit-profesional").html('').hide();

    attributes['OBJECTID'] = parseInt($("#OBJECTID").val());
    
    var Nombres = $('#Nombres').val()
    if (Nombres == '')
    {
      deferred.reject('Debe ingresar nombres');
    } else {
      attributes['Nombres'] = Nombres;
    }

    var Apellidos = $('#Apellidos').val()
    if (Apellidos == '')
    {
      deferred.reject('Debe ingresar apellidos');
    } else {
      attributes['Apellidos'] = Apellidos;
    }

    var Empresa = $('#Empresa').val()
    if (Empresa == '')
    {
      deferred.reject('Debe ingresar empresa');
    } else {
      attributes['Empresa'] = Empresa;
    }

    var Dirección_de_correo_electrónico = $('#Dirección_de_correo_electrónico').val()
    if (Dirección_de_correo_electrónico == '')
    {
      deferred.reject('Debe ingresar correo electrónico');
    } else {
      attributes['Dirección_de_correo_electrónico'] = Dirección_de_correo_electrónico;
    }

    var $boxes = $('input[name=checkBoxProfesional]:checked');

    $boxes.each(function(){
      areas.push($(this).val());
    });

    if (areas.length === 0)
    {
      deferred.reject('Debe ingresar EPC');
    } else {
      attributes['Area_EPC'] = areas.join(', ');
    }

    var Rol_en_Proyecto = $('#Rol_en_Proyecto').val()
    if (Rol_en_Proyecto == '')
    {
      deferred.reject('Debe ingresar Rol en proyecto');
    } else {
      attributes['Rol_en_Proyecto'] = Rol_en_Proyecto;
    }

    var Teléfono_móvil = $('#Teléfono_móvil').val()
    if (Teléfono_móvil == '')
    {
      deferred.reject('Debe ingresar Teléfono móvil');
    } else {
      attributes['Teléfono_móvil'] = Teléfono_móvil;
    }

    var Teléfono_del_trabajo = $('#Teléfono_del_trabajo').val()
    if (Teléfono_del_trabajo == '')
    {
      deferred.reject('Debe ingresar Teléfono trabajo');
    } else {
      attributes['Teléfono_del_trabajo'] = Teléfono_del_trabajo;
    }

    attributes['Nombre_apellido'] = $("#Nombres").val() + ' ' + $("#Apellidos").val();
    attributes['Status'] = $("#Status option:selected").val();

    data['attributes'] = attributes;
    deferred.resolve(data);
    return deferred.promise;
  };

  getDataSolicitante = function () {
    var deferred = new Deferred();
    var data = {};
    var attributes = {};

    attributes['OBJECTID'] = parseInt($("#OBJECTID").val());
    attributes['Nombres'] = $("#Nombres").val();
    attributes['Apellidos'] = $("#Apellidos").val();
    attributes['Empresa'] = $("#Empresa").val();
    attributes['Dirección_de_correo_electrónico'] = $("#Dirección_de_correo_electrónico").val();
    attributes['Cargo'] = $("#Cargo").val();
    attributes['Teléfono_móvil'] = $("#Teléfono_móvil").val();
    attributes['Teléfono_del_trabajo'] = $("#Teléfono_del_trabajo").val();
    attributes['Nombre_apellido'] = $("#Nombres").val() + ' ' + $("#Apellidos").val();
    attributes['Status'] = $("#Status option:selected").val();

    data['attributes'] = attributes;
    deferred.resolve(data);
    return deferred.promise;
  };

  getDataEstado = function () {
    var deferred = new Deferred();
    var data = {};
    var attributes = {};
    var statusGral = null;
    $("#alert-edit-estado").html('').hide();

    attributes['OBJECTID'] = parseInt($("#OBJECTID").val());

    var Estados_Gestion = $('#Estados_Gestion').val()
    if (Estados_Gestion == '')
    {
      deferred.reject('Debe ingresar nombre');
    } else {
      attributes['Estados_Gestion'] = Estados_Gestion;
    }

    var Descripción_del_Estado = $('#Descripción_del_Estado').val()
    if (Descripción_del_Estado == '')
    {
      deferred.reject('Debe ingresar descripción');
    } else {
      attributes['Descripción_del_Estado'] = Descripción_del_Estado;
    }
    
    var $boxes = $('input[name=gridRadios]:checked');

    $boxes.each(function(){
      console.log('$(this).val(): ', $(this).val())
      statusGral = $(this).val();
    });

    if(statusGral===null)
    {
      deferred.reject('Debe seleccionar un status general');
    }else{
      attributes['Estatus_gral'] = statusGral;
    }
    

    data['attributes'] = attributes;
    deferred.resolve(data);
    return deferred.promise;
  };

  return declare(BaseWidget, {
    startup: function(){
      console.log('startup');
      appConfig = this.appConfig;
      getRequest = this.getRequest;
      postRequest = this.postRequest;
      showMessage = this.showMessage;
      getProfesionales = this.getProfesionales;
      getSolicitantes = this.getSolicitantes;
      getEstadosGestion = this.getEstadosGestion;

      //Obtengo el token del usuario logueado de portal
      this.getUserTokenPortal();

      myDialog = new Dialog({
        title: "",
        content: "",
        style: "width: 500px"
      });

      this.getProfesionales();

      this.getSolicitantes();

      this.getEstadosGestion();

      on(dom.byId("mantenedor-lista-profesionales"), on.selector(".profesionales", "click"), function(evt){
        let id = evt.target.dataset.dojoArgs;
        tabla = 'profesionales';
        console.log('aca: ', id);
        var url = appConfig.Sias.urlBase + appConfig.Sias.urlKeyProfesionales;
        var query = new Query();
        query.outFields = ["*"];
        query.orderByFields = ['Nombres']
        query.where = 'OBJECTID=' + id;
        getRequest(url, query).then(
          lang.hitch(this, function(response) { 
            if(response.featureSet.features.length > 0)
            {
              var profesional = response.featureSet.features[0].attributes;
              var activo = (profesional.Status === null || profesional.Status === 1) ? 'selected' : '';
              var inactivo = (profesional.Status === -1 ) ? 'selected' : '';
              var Area_EPC = profesional.Area_EPC;
              var arrArea_EPC = Area_EPC.split(", ");
              var epc1, epc2, epc3, epc4;
              arrayUtils.forEach(arrArea_EPC, function(f) {
                if(f==='EPC-1')
                {
                  epc1 = 'checked';
                }
                if(f==='EPC-2')
                {
                  epc2 = 'checked';
                }
                if(f==='EPC-3')
                {
                  epc3 = 'checked';
                }
                if(f==='EPC-4')
                {
                  epc4 = 'checked';
                }
                
              }, this);


              let content = `<div class="dijitDialogPaneContentArea">
              <table class="table table-hover table-sm">
                <tr>
                  <td><label for="name">Nombres: </label></td>
                  <td>
                    <input data-dojo-type="dijit/form/TextBox" type="text" name="Nombres" id="Nombres" style="width: 100%;" value="${profesional.Nombres}">
                    <input type="hidden" name="OBJECTID" id="OBJECTID" value="${profesional.OBJECTID}">
                  </td>
                </tr>
                <tr>
                  <td><label for="name">Apellidos: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Apellidos" id="Apellidos" style="width: 100%;" value="${profesional.Apellidos}"></td>
                </tr>
                <tr>
                  <td><label for="loc">Empresa: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Empresa" id="Empresa" style="width: 100%;" value="${profesional.Empresa}"></td>
                </tr>
                <tr>
                  <td><label for="desc">Correo: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Dirección_de_correo_electrónico" id="Dirección_de_correo_electrónico" style="width: 100%;" value="${profesional.Dirección_de_correo_electrónico}"></td>
                </tr>
                <tr>
                  <td><label for="desc">Area EPC: </label></td>
                  <td>
                    <div class="form-check" style="padding-bottom: 10px;">
                      <input type="checkbox" class="form-check-input" name="checkBoxProfesional" id="EPC-1" value="EPC-1" style="position: absolute;top: -3px;" ${epc1}>
                      <label class="form-check-label" for="exampleCheck1">EPC 1</label>
                    </div>
                    <div class="form-check" style="padding-bottom: 10px;">
                      <input type="checkbox" class="form-check-input" name="checkBoxProfesional" id="EPC-2" value="EPC-2" style="position: absolute;top: -3px;" ${epc2}>
                      <label class="form-check-label" for="exampleCheck1">EPC 2</label>
                    </div>
                    <div class="form-check" style="padding-bottom: 10px;">
                      <input type="checkbox" class="form-check-input" name="checkBoxProfesional" id="EPC-3" value="EPC-3" style="position: absolute;top: -3px;" ${epc3}>
                      <label class="form-check-label" for="exampleCheck1">EPC 3</label>
                    </div>
                    <div class="form-check" style="padding-bottom: 10px;">
                      <input type="checkbox" class="form-check-input" name="checkBoxProfesional" id="EPC-4" value="EPC-4" style="position: absolute;top: -3px;" ${epc4}>
                      <label class="form-check-label" for="exampleCheck1">EPC 4</label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td><label for="desc">ROL: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Rol_en_Proyecto" id="Rol_en_Proyecto" style="width: 100%;" value="${profesional.Rol_en_Proyecto}"></td>
                </tr>
                <tr>
                  <td><label for="desc">Teléfono móvil: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Teléfono_móvil" id="Teléfono_móvil" style="width: 100%;" value="${profesional.Teléfono_móvil}"></td>
                </tr>
                <tr>
                  <td><label for="desc">Teléfono trabajo: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Teléfono_del_trabajo" id="Teléfono_del_trabajo" style="width: 100%;" value="${profesional.Teléfono_del_trabajo}"></td>
                </tr>
                <tr>
                  <td><label for="desc">Estado: </label></td>
                  <td>
                    <select name="Status" id="Status" style="width: 100%;" class="form-control">
                      <option value="1" ${activo}>Activo</option>
                      <option value="-1" ${inactivo}>Inactivo</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">
                    <div id="alert-edit-profesional" class="alert alert-danger" role="alert" style="display:none;"></div>
                  </td>
                </tr>
              </table>
            </div>
            <div class="dijitDialogPaneActionBar">
              <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:actualizar">Guardar</button>
              <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:cancel">Cancelar</button>
            </div>`;

            myDialog.set("title", 'Profesional');
            myDialog.set("content", content);
            myDialog.show();
            }
          }),
          function(objErr) {
            console.log('request failed', objErr)
          }
        )
      });

      on(dom.byId("mantenedor-lista-solicitantes"), on.selector(".solicitantes", "click"), function(evt){
        let id = evt.target.dataset.dojoArgs;
        tabla = 'solicitantes';
        // let query = '/query?outFields=*&orderByFields=Nombres&where=OBJECTID='+id+'&f=pjson';
        var url = appConfig.Sias.urlBase + appConfig.Sias.urlKeySolicitante;
        var query = new Query();
        query.outFields = ["*"];
        query.orderByFields = ['Nombres']
        query.where = 'OBJECTID=' + id;
        getRequest(url, query).then(
          lang.hitch(this, function(response) { 
            if(response.featureSet.features.length > 0)
            {
              var solicitante = response.featureSet.features[0].attributes;
              var activo = (solicitante.Status === null || solicitante.Status === 1) ? 'selected' : '';
              var inactivo = (solicitante.Status === -1 ) ? 'selected' : '';
              let content = `<div class="dijitDialogPaneContentArea">
              <table class="table table-hover table-sm">
                <tr>
                  <td><label for="name">Nombres: </label></td>
                  <td>
                    <input data-dojo-type="dijit/form/TextBox" type="text" name="Nombres" id="Nombres" style="width: 100%;" value="${solicitante.Nombres}">
                    <input type="hidden" name="OBJECTID" id="OBJECTID" value="${solicitante.OBJECTID}">
                  </td>
                </tr>
                <tr>
                  <td><label for="name">Apellidos: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Apellidos" id="Apellidos" style="width: 100%;" value="${solicitante.Apellidos}"></td>
                </tr>
                <tr>
                  <td><label for="loc">Empresa: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Empresa" id="Empresa" style="width: 100%;" value="${solicitante.Empresa}"></td>
                </tr>
                <tr>
                  <td><label for="desc">Correo: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Dirección_de_correo_electrónico" id="Dirección_de_correo_electrónico" style="width: 100%;" value="${solicitante.Dirección_de_correo_electrónico}"></td>
                </tr>
                <tr>
                  <td><label for="desc">Cargo: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Cargo" id="Cargo" style="width: 100%;" value="${solicitante.Cargo}"></td>
                </tr>
                <tr>
                  <td><label for="desc">Teléfono móvil: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Teléfono_móvil" id="Teléfono_móvil" style="width: 100%;" value="${solicitante.Teléfono_móvil}"></td>
                </tr>
                <tr>
                  <td><label for="desc">Teléfono trabajo: </label></td>
                  <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Teléfono_del_trabajo" id="Teléfono_del_trabajo" style="width: 100%;" value="${solicitante.Teléfono_del_trabajo}"></td>
                </tr>
                <tr>
                <td><label for="desc">Estado: </label></td>
                <td>
                  <select name="Status" id="Status" style="width: 100%;" class="form-control">
                    <option value="1" ${activo}>Activo</option>
                    <option value="-1" ${inactivo}>Inactivo</option>
                  </select>
                </td>
              </tr>
              </table>
            </div>
            <div class="dijitDialogPaneActionBar">
              <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:actualizar">Guardar</button>
              <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:cancel">Cancelar</button>
            </div>`;

            myDialog.set("title", 'Solicitante');
            myDialog.set("content", content);
            myDialog.show();
            }
          }),
          function(objErr) {
            console.log('request failed', objErr)
          }
        )
      });

      on(dom.byId("mantenedor-lista-estados"), on.selector(".estado-gestion", "click"), function(evt){
        let id = evt.target.dataset.dojoArgs;
        tabla = 'estados';
        // let query = '/query?outFields=*&orderByFields=Estados_Gestion&where=OBJECTID='+id+'&f=pjson';
        var url = appConfig.Sias.urlBase + appConfig.Sias.urlKeyEstadoGestion;
        var query = new Query();
        query.outFields = ["*"];
        query.orderByFields = ['Estados_Gestion']
        query.where = 'OBJECTID=' + id;
        getRequest(url, query).then(
          lang.hitch(this, function(response) { 
            if(response.featureSet.features.length > 0)
            {
              var estado = response.featureSet.features[0].attributes;
              var statusGeneral = estado.Estatus_gral;
              var checkPl, checkEt, checkAp, checkDm, checkDs;

              if(statusGeneral === 'Planificada')
              {
                checkPl='checked';
              }else if (statusGeneral === 'En trámite'){
                checkEt='checked';
              }else if (statusGeneral === 'Aprobada'){
                checkAp='checked';
              }else if (statusGeneral === 'Desmovilizada'){
                checkDm='checked';
              }else if (statusGeneral === 'Desistida'){
                checkDs='checked';
              }

              let content = `<div class="dijitDialogPaneContentArea">
              <table class="table table-hover table-sm">
                <tr>
                  <td><label for="name">Nombre: </label></td>
                  <td>
                    <input data-dojo-type="dijit/form/TextBox" type="text" name="Estados_Gestion" id="Estados_Gestion" style="width: 100%;" value="${estado.Estados_Gestion}">
                    <input type="hidden" name="OBJECTID" id="OBJECTID" value="${estado.OBJECTID}">
                  </td>
                </tr>
                <tr>
                  <td><label for="name">Descripción del estado: </label></td>
                  <td><textarea name="Descripción_del_Estado" id="Descripción_del_Estado" data-dojo-type="dijit/form/Textarea" style="width: 100%;">${estado.Descripción_del_Estado}</textarea></td>
                </tr>
                <tr>
                  <td><label for="loc">Status general: </label></td>
                  <td>
                    <div class="form-check" style="padding-bottom: 10px;">
                      <input type="radio" class="form-check-input" name="gridRadios" value="Planificada" id="Estatus_gral_Planificada" style="position: absolute;top: -3px;" ${checkPl}>
                      <label class="form-check-label" for="exampleCheck1">Planificada</label>
                    </div>
                    <div class="form-check" style="padding-bottom: 10px;">
                      <input type="radio" class="form-check-input" name="gridRadios" value="En trámite" id="Estatus_gral_Tramite" style="position: absolute;top: -3px;" ${checkEt}>
                      <label class="form-check-label" for="exampleCheck1">En trámite</label>
                    </div>
                    <div class="form-check" style="padding-bottom: 10px;">
                      <input type="radio" class="form-check-input" name="gridRadios" value="Aprobada" id="Estatus_gral_Aprobada" style="position: absolute;top: -3px;" ${checkAp}>
                      <label class="form-check-label" for="exampleCheck1">Aprobada</label>
                    </div>
                    <div class="form-check" style="padding-bottom: 10px;">
                      <input type="radio" class="form-check-input" name="gridRadios" value="Desmovilizada" id="Estatus_gral_Desmovilizada" style="position: absolute;top: -3px;" ${checkDm}>
                      <label class="form-check-label" for="exampleCheck1">Desmovilizada</label>
                    </div>
                    <div class="form-check" style="padding-bottom: 10px;">
                      <input type="radio" class="form-check-input" name="gridRadios" value="Desistida" id="Estatus_gral_Desistida" style="position: absolute;top: -3px;" ${checkDs}>
                      <label class="form-check-label" for="exampleCheck1">Desistida</label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">
                    <div id="alert-edit-estado" class="alert alert-danger" role="alert" style="display:none;"></div>
                  </td>
                </tr>
              </table>
            </div>
            <div class="dijitDialogPaneActionBar">
              <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:actualizar">Guardar</button>
              <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:cancel">Cancelar</button>
            </div>`;

            myDialog.set("title", 'Estado de gestión');
            myDialog.set("content", content);
            myDialog.show();
            }
          }),
          function(objErr) {
            console.log('request failed', objErr)
          }
        )
      });
    },

    getUserTokenPortal: function () {
      var portalUrl = portalUrlUtils.getStandardPortalUrl(this.appConfig.portalUrl);
      var portal = portalUtils.getPortal(portalUrl);
      if(portal.user !== null)
      {
        userPortal = portal.user;
        userToken = userPortal.credential.token;
      }
    },

    getProfesionales: function () {
      // var query = '/query?outFields=*&where=1%3D1&orderByFields=Nombre_apellido&f=pjson';
      var url = this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeyProfesionales;
      var query = new Query();
      query.outFields = ["*"];
      query.orderByFields = ['Nombre_apellido']
      query.where = '1=1';
      this.getRequest(url, query).then(
        lang.hitch(this, function(response) { 
          if(response.featureSet.features.length > 0)
          {
            let html = '<table class="table table-hover table-sm mt-3">';
            arrayUtils.forEach(response.featureSet.features, function(f) {
              var clase = (f.attributes.Status === -1) ? 'alert-danger' : '';
              html += '<tr class="' + clase + '"><td>' + f.attributes.Nombre_apellido + '</td><td><button type="button" data-dojo-type="dijit/form/Button" class="btn btn-primary btn-sm profesionales" data-dojo-args="' + f.attributes.OBJECTID + '">Editar</button></td></tr>';
            }, this);
            html += '</table>';
            $('#mantenedor-lista-profesionales').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    getSolicitantes: function () {
      // var query = '/query?outFields=*&where=1%3D1&f=pjson';
      var url = this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeySolicitante;
      var query = new Query();
      query.outFields = ["*"];
      query.orderByFields = ['Nombre_apellido']
      query.where = '1=1';
      this.getRequest(url, query).then(
        lang.hitch(this, function(response) { 
          if(response.featureSet.features.length > 0)
          {
            let html = '<table class="table table-hover table-sm mt-3">';
            arrayUtils.forEach(response.featureSet.features, function(f) {
              var clase = (f.attributes.Status === -1) ? 'alert-danger' : '';
              html += '<tr class="' + clase + '"><td>' + f.attributes.Nombre_apellido + ' (' + f.attributes.Empresa + ')</td><td><button type="button" data-dojo-type="dijit/form/Button" class="btn btn-primary btn-sm solicitantes" data-dojo-args="' + f.attributes.OBJECTID  + '">Editar</button></td></tr>';
            }, this);
            html += '</table>'
            $('#mantenedor-lista-solicitantes').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    getEstadosGestion: function () {
      // var query = '/query?outFields=*&where=1%3D1&f=pjson';
      var url = this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeyEstadoGestion;
      var query = new Query();
      query.outFields = ["*"];
      query.orderByFields = ['Estados_Gestion']
      query.where = '1=1';
      this.getRequest(url, query).then(
        lang.hitch(this, function(response) { 
          if(response.featureSet.features.length > 0)
          {
            let html = '<table class="table table-hover table-sm mt-3">';
            arrayUtils.forEach(response.featureSet.features, function(f) {
              html += '<tr><td>' + f.attributes.Estados_Gestion + '</td><td><button type="button" data-dojo-type="dijit/form/Button" class="btn btn-primary btn-sm estado-gestion" data-dojo-args="' + f.attributes.OBJECTID  + '">Editar</button></td></tr>';
            }, this);
            html += '</table>'
            $('#mantenedor-lista-estados').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    _onclickCrearProfesional: function () {
      tabla = 'profesionales';
      let content = `<div class="dijitDialogPaneContentArea">
        <table class="table table-hover table-sm">
          <tr>
            <td><label for="name">Nombres: </label></td>
            <td>
              <input data-dojo-type="dijit/form/TextBox" type="text" name="Nombres" id="Nombres" style="width: 100%;" value="">
            </td>
          </tr>
          <tr>
            <td><label for="name">Apellidos: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Apellidos" id="Apellidos" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="loc">Empresa: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Empresa" id="Empresa" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="desc">Correo: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Dirección_de_correo_electrónico" id="Dirección_de_correo_electrónico" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="desc">Area EPC: </label></td>
            <td>
              <div class="form-check" style="padding-bottom: 10px;">
                <input type="checkbox" class="form-check-input" name="checkBoxProfesional" id="EPC-1" value="EPC-1" style="position: absolute;top: -3px;">
                <label class="form-check-label" for="exampleCheck1">EPC 1</label>
              </div>
              <div class="form-check" style="padding-bottom: 10px;">
                <input type="checkbox" class="form-check-input" name="checkBoxProfesional" id="EPC-2" value="EPC-2" style="position: absolute;top: -3px;">
                <label class="form-check-label" for="exampleCheck1">EPC 2</label>
              </div>
              <div class="form-check" style="padding-bottom: 10px;">
                <input type="checkbox" class="form-check-input" name="checkBoxProfesional" id="EPC-3" value="EPC-3" style="position: absolute;top: -3px;">
                <label class="form-check-label" for="exampleCheck1">EPC 3</label>
              </div>
              <div class="form-check" style="padding-bottom: 10px;">
                <input type="checkbox" class="form-check-input" name="checkBoxProfesional" id="EPC-4" value="EPC-4" style="position: absolute;top: -3px;">
                <label class="form-check-label" for="exampleCheck1">EPC 4</label>
              </div>
            </td>
          </tr>
          <tr>
            <td><label for="desc">ROL: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Rol_en_Proyecto" id="Rol_en_Proyecto" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="desc">Teléfono móvil: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Teléfono_móvil" id="Teléfono_móvil" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="desc">Teléfono trabajo: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Teléfono_del_trabajo" id="Teléfono_del_trabajo" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="desc">Estado: </label></td>
            <td>
              <select name="Status" id="Status" style="width: 100%;" class="form-control">
                <option value="1">Activo</option>
                <option value="-1">Inactivo</option>
              </select>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <div id="alert-crear-profesional" class="alert alert-danger" role="alert" style="display:none;"></div>
            </td>
          </tr>
        </table>
      </div>
      <div class="dijitDialogPaneActionBar">
        <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:guardar">Guardar</button>
        <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:cancel">Cancelar</button>
      </div>`;

      myDialog.set("title", 'Profesional');
      myDialog.set("content", content);
      myDialog.show();
    },

    _onclickCrearSolicitante: function () {
      tabla = 'solicitantes';
      let content = `<div class="dijitDialogPaneContentArea">
        <table class="table table-hover table-sm">
          <tr>
            <td><label for="name">Nombres: </label></td>
            <td>
              <input data-dojo-type="dijit/form/TextBox" type="text" name="Nombres" id="Nombres" style="width: 100%;" value="">
            </td>
          </tr>
          <tr>
            <td><label for="name">Apellidos: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Apellidos" id="Apellidos" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="loc">Empresa: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Empresa" id="Empresa" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="desc">Correo: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Dirección_de_correo_electrónico" id="Dirección_de_correo_electrónico" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="desc">Cargo: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Cargo" id="Cargo" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="desc">Teléfono móvil: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Teléfono_móvil" id="Teléfono_móvil" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="desc">Teléfono trabajo: </label></td>
            <td><input data-dojo-type="dijit/form/TextBox" type="text" name="Teléfono_del_trabajo" id="Teléfono_del_trabajo" style="width: 100%;" value=""></td>
          </tr>
          <tr>
            <td><label for="desc">Estado: </label></td>
            <td>
              <select name="Status" id="Status" style="width: 100%;" class="form-control">
                <option value="1">Activo</option>
                <option value="-1">Inactivo</option>
              </select>
            </td>
          </tr>
        </table>
      </div>
      <div class="dijitDialogPaneActionBar">
        <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:guardar">Guardar</button>
        <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:cancel">Cancelar</button>
      </div>`;

      myDialog.set("title", 'Solicitante');
      myDialog.set("content", content);
      myDialog.show();
    },

    _onclickCrearEstadoGestion: function () {
      tabla = 'estados';
      let content = `<div class="dijitDialogPaneContentArea">
        <table class="table table-hover table-sm">
          <tr>
            <td><label for="name">Nombre: </label></td>
            <td>
              <input data-dojo-type="dijit/form/TextBox" type="text" name="Estados_Gestion" id="Estados_Gestion" style="width: 100%;" value="">
            </td>
          </tr>
          <tr>
            <td><label for="name">Descripción del estado: </label></td>
            <td><textarea name="Descripción_del_Estado" id="Descripción_del_Estado" data-dojo-type="dijit/form/Textarea" style="width: 100%;"></textarea></td>
          </tr>
          <tr>
            <td><label for="loc">Status general: </label></td>
            <td>
              <div class="form-check" style="padding-bottom: 10px;">
                <input type="radio" class="form-check-input" name="gridRadios" value="Planificada" id="Estatus_gral_Planificada" style="position: absolute;top: -3px;">
                <label class="form-check-label" for="exampleCheck1">Planificada</label>
              </div>
              <div class="form-check" style="padding-bottom: 10px;">
                <input type="radio" class="form-check-input" name="gridRadios" value="En trámite" id="Estatus_gral_Tramite" style="position: absolute;top: -3px;">
                <label class="form-check-label" for="exampleCheck1">En trámite</label>
              </div>
              <div class="form-check" style="padding-bottom: 10px;">
                <input type="radio" class="form-check-input" name="gridRadios" value="Aprobada" id="Estatus_gral_Aprobada" style="position: absolute;top: -3px;">
                <label class="form-check-label" for="exampleCheck1">Aprobada</label>
              </div>
              <div class="form-check" style="padding-bottom: 10px;">
                <input type="radio" class="form-check-input" name="gridRadios" value="Desmovilizada" id="Estatus_gral_Desmovilizada" style="position: absolute;top: -3px;">
                <label class="form-check-label" for="exampleCheck1">Desmovilizada</label>
              </div>
              <div class="form-check" style="padding-bottom: 10px;">
                <input type="radio" class="form-check-input" name="gridRadios" value="Desistida" id="Estatus_gral_Desistida" style="position: absolute;top: -3px;">
                <label class="form-check-label" for="exampleCheck1">Desistida</label>
              </div>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <div id="alert-crear-estado" class="alert alert-danger" role="alert" style="display:none;"></div>
            </td>
          </tr>
        </table>
      </div>
      <div class="dijitDialogPaneActionBar">
        <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:guardar">Guardar</button>
        <button data-dojo-type="dijit/form/Button" type="button" data-dojo-props="onClick:cancel">Cancelar</button>
      </div>`;

      myDialog.set("title", 'Estado de gestión');
      myDialog.set("content", content);
      myDialog.show();
    },

    _onclickCerrar: function () {
      console.log('ACAAAA_onclickCerrarA');
      myDialog.hide();
    },

    getRequest: function (url, query) {
      try{
        var deferred = new Deferred();
        var queryTask = new QueryTask(url);
        
        queryTask.execute(query);
        queryTask.on("complete", function(response){
          console.log('complete response: ', response)
          deferred.resolve(response);
        });
        queryTask.on("error", function(error){
          console.log('error: ', error)
          deferred.reject();
        });
      } catch(err) {
          console.log('request failed', err)
        deferred.reject();
      }
      return deferred.promise;
    },

    getRequest_old: function (url) {
      try{
        var deferred = new Deferred();
        fetch(url + '&token=' + userToken)
          .then(data => data.text())
          .then((text) => {
            var data = JSON.parse(text);
            deferred.resolve(data);
          }).catch(function (error) {
            console.log('request failed', error)
            deferred.reject();
          }
        );
      } catch(err) {
        console.log('request failed', err)
				deferred.reject();
			}
      return deferred.promise;
    },

    postRequest: function (url, data, type) {
      try{
        var deferred = new Deferred();
        
        let formData = new FormData();
        formData.append('f', 'json');
        formData.append(type, data);
        if(userToken !== null)
        {
          formData.append('token', userToken);
        }

        let fetchData = {
            method: 'POST',
            body: formData,
            headers: new Headers()
        }

        fetch(url, fetchData)
          .then(data => data.text())
          .then((text) => {
            var data = JSON.parse(text);
            console.log('responseee: ', data)
            deferred.resolve(data);

          }).catch(function (error) {
            console.log('request failed', error)
            deferred.reject();
          }
        );
      } catch(err) {
        console.log('request failed', err)
				deferred.reject();
			}
      return deferred.promise;
    },

    showMessage: function (msg, type) {
      let class_icon = "message-info-icon";
      switch (type) {
        case "error":
          class_icon = "message-error-icon";
          break;
        case "warning":
          class_icon = "message-warning-icon";
          break;
      }
      let content = '<i class="' + class_icon + '">&nbsp;</i>' + msg;
      new Message({
        message: content
      });
    },

    onOpen: function () {
      console.log('onOpen');
    },

    onClose: function () {
      console.log('onClose');
      tabla = null;
    }
  });
});
