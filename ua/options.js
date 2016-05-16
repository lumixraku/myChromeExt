(function() {
    var elem_ids = ['device_default_button', 'device_list', 'current_ua_field',
            'current_ua_field',
            'add_device_button', 'restore_defaults_button'
        ],
        elems = {},
        deviceListStr,
        defaultDevices = {
            apple_iphone_4: {
                name: 'Apple iPhone 4',
                ua: 'Mozilla/5.0 (iPod; U; CPU iPhone OS 4_0 like Mac OS X; en-us) AppleWebKit/532.9 (KHTML, like Gecko) Version/4.0.5 Mobile/8A293 Safari/6531.22.7'
            },
            apple_iphone_5: {
                name: 'Apple iPhone 5',
                ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
            },
            apple_iphone_6: {
                name: 'Apple iPhone 6',
                ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
            },
            apple_iphone_6_plus: {
                name: 'Apple iPhone 6+',
                ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
            },
            apple_ipad: {
                name: 'Apple iPad',
                ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
            },
            galaxy_s5: {
                name: 'Galaxy S5',
                ua: 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36'
            },
            nexus_5x: {
                name: 'Nexus 5X',
                ua: 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36'
            },
            nexus_6p: {
                name: 'Nexus 6P',
                ua: 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36'
            }
        },
        devices = (localStorage['devices']) ? JSON.parse(localStorage['devices']) : defaultDevices,
        dom = {
            createLabel: function(deviceID, deviceName) {
                var label = document.createElement('label');
                label.setAttribute('for', 'device_' + deviceID + '_button');
                label.innerHTML = deviceName;
                label.addEventListener('click', listeners.deviceLabelClick);
                return label;
            },
            createRadioButton: function(deviceID) {
                var radioButton = document.createElement('input');
                radioButton.setAttribute('type', 'radio');
                radioButton.setAttribute('name', 'device');
                radioButton.setAttribute('id', 'device_' + deviceID + '_button');
                radioButton.setAttribute('value', deviceID);
                radioButton.addEventListener('click', listeners.deviceButtonClick);
                return radioButton;
            },
            createTextField: function(deviceID, deviceName) {
                var textField = document.createElement('input'),
                    elementID = deviceID ? 'device_' + deviceID + '_textfield' : 'new_field';
                textField.setAttribute('type', 'text');
                textField.setAttribute('value', deviceName || '');
                textField.setAttribute('id', elementID);
                textField.addEventListener('blur', listeners.nameBlur);
                return textField;
            }
        },
        listeners = {
            deviceLabelClick: function(event) {
                var now = new Date().getTime();
                if (!this.lastClicked || now - this.lastClicked > 1000) {
                    this.lastClicked = now;
                    return;
                }
                this.lastClicked = 0;
                var deviceID = event.target.getAttribute('for').match(/device_(.+)_button/i)[1],
                    deviceName = event.target.innerHTML,
                    textField = dom.createTextField(deviceID, deviceName);
                event.target.parentNode.replaceChild(textField, event.target);
                textField.focus();
            },
            nameBlur: function(event) {
                var oldDeviceID,
                    newDeviceID,
                    deviceName = event.target.value;

                newDeviceID = deviceName.replace(/ /gi, '_').toLowerCase();
                oldDeviceID = event.target.id.match(/device_(.+)_textfield/i);
                oldDeviceID = oldDeviceID && oldDeviceID[1];


                if (oldDeviceID && newDeviceID) {
                    // Replace text field with label
                    var li = document.createElement('li'),
                        radio = dom.createRadioButton(newDeviceID),
                        label = dom.createLabel(newDeviceID, deviceName);
                    li.setAttribute('id', 'device_' + newDeviceID + '_li');
                    li.appendChild(radio);
                    li.appendChild(label);

                    event.target.parentNode.parentNode.replaceChild(li, event.target.parentNode);
                    devices[newDeviceID] = devices[oldDeviceID];
                    devices[newDeviceID].name = deviceName;
                    if (oldDeviceID !== newDeviceID) {
                        delete devices[oldDeviceID];
                    }
                    localStorage['devices'] = JSON.stringify(devices);
                } else {
                    // Delete oldDeviceID's list element
                    deleteDevice(oldDeviceID);
                    if (newDeviceID) {
                        // Insert new element
                        while (devices[newDeviceID]) {
                            newDeviceID += '-';
                        }
                        devices[newDeviceID] = {
                            name: deviceName,
                            ua: current_ua_field.value
                        };
                        addDeviceElement(newDeviceID, deviceName);
                        localStorage['devices'] = JSON.stringify(devices);
                    }
                }
            },
            deviceButtonClick: function(event) {
                var regexp = new RegExp('(default' + (deviceListStr ? '|' + deviceListStr : '') + ')', 'i'),
                    deviceID = event.target.id.match(regexp);
                deviceID = deviceID && deviceID[1];
                if (!deviceID) {
                    return;
                }
                localStorage['deviceID'] = deviceID;
                // Careful setting the localStorage value to prevent setting it with the string 'undefined'
                if (devices[deviceID]) {
                    localStorage['user-agent'] = elems.current_ua_field.value = devices[deviceID].ua;
                } else {
                    delete localStorage['user-agent'];
                    elems.current_ua_field.value = '';
                }
            },
            addDeviceButtonClick: function(event) {
                var listelement = document.createElement('li'),
                    textField = dom.createTextField();

                listelement.appendChild(textField);
                listelement.setAttribute('id', 'new_device');
                elems['device_list'].appendChild(listelement);
                elems['device_list'].appendChild(document.createTextNode(' '));
                textField.focus();
            },
            restoreDefaultsButtonClick: function(event) {
                var li;
                devices = defaultDevices;
                delete localStorage['devices'];
                while (li = elems.device_list.firstChild) {
                    elems.device_list.removeChild(li);
                }
                deviceStr = '';
                loadDevices();
                document.getElementById('device_default_button').click();
            },
            textAreaType: function(event) {
                var activeDeviceID = 'default';
                for (var deviceID in devices) {
                    if (devices.hasOwnProperty(deviceID)) {
                        if (document.getElementById('device_' + deviceID + '_button').checked) {
                            activeDeviceID = deviceID;
                            break;
                        }
                    }
                }
                devices[activeDeviceID].ua = localStorage['user-agent'] = event.target.value;
                localStorage['devices'] = JSON.stringify(devices);
            }
        },
        addDeviceElement = function(deviceID, deviceName) {
            if (deviceListStr) {
                deviceListStr += '|';
            }
            deviceListStr += deviceID;
            var listItem = document.createElement('li'),
                radioButton = dom.createRadioButton(deviceID);
            label = dom.createLabel(deviceID, deviceName);

            listItem.appendChild(radioButton);
            listItem.appendChild(label);
            listItem.setAttribute('id', 'device_' + deviceID + '_li');
            elems['device_list'].appendChild(listItem);
            elems['device_list'].appendChild(document.createTextNode(' '));
        },
        deleteDevice = function(deviceID) {
            var listElementID = deviceID ? 'device_' + deviceID + '_li' : 'new_device';
            listElement = document.getElementById(listElementID);
            elems['device_list'].removeChild(listElement);
            delete devices[deviceID];
            deviceListStr = deviceListStr.replace(deviceID, '');
            localStorage['devices'] = JSON.stringify(devices);
        },
        loadDevices = function() {
            // Add the devices, ensuring that "default" is at the top of the list
            addDeviceElement('default', 'Default');
            for (var deviceID in devices) {
                if (devices.hasOwnProperty(deviceID) && deviceID !== 'default') {
                    addDeviceElement(deviceID, devices[deviceID].name);
                }
            }
            devices['default'] = { 'name': 'Default', 'ua': '' };

            localStorage['deviceID'] = (localStorage['deviceID'] && devices[localStorage['deviceID']]) ? localStorage['deviceID'] : 'default';
        },
        initForm = function() {
            if (localStorage['deviceID']) {
                document.getElementById('device_' + localStorage['deviceID'] + '_button').setAttribute('checked', true);
                elems.current_ua_field.value = (devices[localStorage['deviceID']]) ? devices[localStorage['deviceID']].ua : '';
            }
        };
    document.addEventListener("DOMContentLoaded", function() {
        // Grab the DOM elements that need event handlers attached
        elem_ids.forEach(function(element_id) {
            elems[element_id] = document.getElementById(element_id);
        });

        loadDevices();
        initForm();

        elems.add_device_button.addEventListener('click', listeners.addDeviceButtonClick);
        elems.restore_defaults_button.addEventListener('click', listeners.restoreDefaultsButtonClick);
        elems.current_ua_field.addEventListener('keyup', listeners.textAreaType);
    });
})();
