var app = {
/*
   Application constructor
 */
   initialize: function() {
      this.bindEvents();
      console.log("Starting NFC Reader app");
   },
/*
   bind any events that are required on startup to listeners:
*/
   bindEvents: function() {
      document.addEventListener('deviceready', this.onDeviceReady, false);
   },

/*
   this runs when the device is ready for user interaction:
*/
   onDeviceReady: function() {

      nfc.addMimeTypeListener(
         "text/plain", // listen for plain-text messages
         app.onNfc, // tag successfully scanned
         function (status) { // listener successfully initialized
            app.display("Acerca una tarjeta");
         },
         function (error) { // listener fails to initialize
            app.display("NFC reader failed to initialize " +
            JSON.stringify(error));
         }
      );
   },

/*
   displays tag ID from @nfcEvent in message div:
*/

   onNfc: function(nfcEvent) {
      var tag = nfcEvent.tag,
      text = "",
      payload;
      app.clear();
      //app.display("Read tag: " + nfc.bytesToHexString(tag.id));
      // get the playload from the first message
      payload = tag.ndefMessage[0].payload;
      if (payload[0] < 5) {
         // payload begins with a small integer, it's encoded text
         var languageCodeLength = payload[0];
         // chop off the language code and convert to string
         text = nfc.bytesToString(payload.slice(languageCodeLength + 1));
      } else {
         // assume it's text without language info
         text = nfc.bytesToString(payload);
      }
      app.display(text);
   },

   /*
      appends @message to the message div:
   */
   display: function(message) {


      var label = document.createTextNode(message);
      /*lineBreak = document.createElement("span");*/
      /*messageDiv.appendChild(lineBreak);         // add a line break*/
      messageDiv.appendChild(label);             // add the text
      //document.getElementById('messageDiv').setActive();
      //document.getElementById('messageDiv').textContent += message;
      //messageDiv.focus();
   },

   /*focus: function(){
      window.location.hash = '#messageDiv';
   },*/
   /*
      clears the message div:
   */
   clear: function() {
       messageDiv.innerHTML = "";
   }
};     // end of app

