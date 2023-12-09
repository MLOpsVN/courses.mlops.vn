/* encryptcontent/decrypt-contents.tpl.js */

/* Strips the padding character from decrypted content. */
function strip_padding(padded_content, padding_char) {
    for (var i = padded_content.length; i > 0; i--) {
        if (padded_content[i - 1] !== padding_char) {
            return padded_content.slice(0, i);
        }
    }
    return '';
};

/* Decrypts the content from the ciphertext bundle. */
function decrypt_content(password, iv_b64, ciphertext_b64, padding_char) {
    var key = CryptoJS.MD5(password),
        iv = CryptoJS.enc.Base64.parse(iv_b64),
        ciphertext = CryptoJS.enc.Base64.parse(ciphertext_b64),
        bundle = {
            key: key,
            iv: iv,
            ciphertext: ciphertext
        };
    var plaintext = CryptoJS.AES.decrypt(bundle, key, {
        iv: iv,
        padding: CryptoJS.pad.NoPadding
    });
    try {
        return strip_padding(plaintext.toString(CryptoJS.enc.Utf8), padding_char);
    } catch (err) {
        // encoding failed; wrong password
        return false;
    }
};

/* Split cyphertext bundle and try to decrypt it */
function decrypt_content_from_bundle(password, ciphertext_bundle) {
    // grab the ciphertext bundle and try to decrypt it
    if (ciphertext_bundle) {
        let parts = ciphertext_bundle.split(';');
        if (parts.length == 3) {
            return decrypt_content(password, parts[0], parts[1], parts[2]);
        }
    }
    return false;
};

/* Set key:value with expire time in sessionStorage/localStorage */
function setItemExpiry(key, value, ttl) {
    const now = new Date()
    const item = {
        value: encodeURIComponent(value),
        expiry: now.getTime() + ttl,
    }
    sessionStorage.setItem('encryptcontent_' + encodeURIComponent(key), JSON.stringify(item))
};

/* Delete key with specific name in sessionStorage/localStorage */
function delItemName(key) {
    sessionStorage.removeItem('encryptcontent_' + encodeURIComponent(key));
};

/* Get key:value from sessionStorage/localStorage */
function getItemExpiry(key) {
    let ret = {
        value: null,
        fallback: false
    };
    let remember_password;
    remember_password = sessionStorage.getItem('encryptcontent_' + encodeURIComponent(key));
    if (!remember_password) {
        ret.fallback = true; //fallback is set to not display a "decryption failed" message
        // fallback one level up
        let last_slash = key.slice(0, -1).lastIndexOf('/')
        if (last_slash !== -1 && last_slash > 0) {
            let keyup = key.substring(0,last_slash+1);
            remember_password = sessionStorage.getItem('encryptcontent_' + encodeURIComponent(keyup));
        }
        if (!remember_password) {
            // fallback site_path
            remember_password = sessionStorage.getItem('encryptcontent_' + encodeURIComponent(""));
            if (!remember_password) {
                // fallback global
                remember_password = sessionStorage.getItem('encryptcontent_');
                if (!remember_password) {
                    //no password saved and no fallback found
                    return null;
                }
            }
        }
    }
    const item = JSON.parse(remember_password)
    if (!ret.fallback) { //no need to do this if fallback was used
        const now = new Date()
        if (now.getTime() > item.expiry) {
            // if the item is expired, delete the item from storage and return null
            delItemName(key);
            return null;
        }
    }
    ret.value = decodeURIComponent(item.value);
    return ret;
};

/* Reload scripts src after decryption process */
function reload_js(src) {
    let script_src, script_tag, new_script_tag;
    let head = document.getElementsByTagName('head')[0];

    if (src.startsWith('#')) {
        script_tag = document.getElementById(src.substr(1));
        if (script_tag) {
            script_tag.remove();
            new_script_tag = document.createElement('script');
            new_script_tag.innerHTML = script_tag.innerHTML;
            head.appendChild(new_script_tag);
        }
    } else {
        if (base_url == '.') {
            script_src = src;
        } else {
            script_src = base_url + '/' + src;
        }

        script_tag = document.querySelector('script[src="' + script_src + '"]');
        if (script_tag) {
            script_tag.remove();
            new_script_tag = document.createElement('script');
            new_script_tag.src = script_src;
            head.appendChild(new_script_tag);
        }
    }
};



/* Decrypt speficique html entry from mkdocs configuration */
function decrypt_somethings(password_value, encrypted_something) {
    var html_item = '';
    for (const [name, tag] of Object.entries(encrypted_something)) {
        if (tag[1] == 'id') {
            html_item = [document.getElementById(name)];
        } else if (tag[1] == 'class') {
            html_item = document.getElementsByClassName(name);
        } else {
            console.log('WARNING: Unknow tag html found, check "encrypted_something" configuration.');
        }
        if (html_item[0]) {
            for (i = 0; i < html_item.length; i++) {
                // grab the cipher bundle if something exist
                let content = decrypt_content_from_bundle(password_value, html_item[i].innerHTML);
                if (content !== false) {
                    // success; display the decrypted content
                    html_item[i].innerHTML = content;
                    html_item[i].style.display = null;
                    // any post processing on the decrypted content should be done here
                }
            }
        }
    }
};

/* Decrypt content of a page */
function decrypt_action(password_input, encrypted_content, decrypted_content) {
    // grab the ciphertext bundle
    // and decrypt it
    let content = decrypt_content_from_bundle(password_input.value, encrypted_content.innerHTML);
    if (content !== false) {
        // success; display the decrypted content
        decrypted_content.innerHTML = content;
        // encrypted_content.parentNode.removeChild(encrypted_content);
        // any post processing on the decrypted content should be done here
        
        
        
        
        return true
    } else {
        return false
    }
};

function decryptor_reaction(content_decrypted, password_input, fallback_used, set_global, save_cookie) {
    let location_path;
    if (set_global) {
        location_path = "/"; //global password decrypts at "/{site_path}"
    } else {
        location_path = encryptcontent_path;
    }
    if (content_decrypted) {
        // keep password value on sessionStorage/localStorage with specific path (relative)
        if (set_global) {
            setItemExpiry("", password_input.value, 1000*3600*24);
        }
        else if (!fallback_used) {
            setItemExpiry(location_path, password_input.value, 1000*3600*24);
        }
        // continue to decrypt others parts
        
        
    } else {
        // remove item on sessionStorage/localStorage if decryption process fail (Invalid item)
        if (!fallback_used || set_global) {
            // create HTML element for the inform message
            let mkdocs_decrypt_msg = document.getElementById('mkdocs-decrypt-msg');
            mkdocs_decrypt_msg.textContent = 'Invalid password.';
            delItemName(location_path);
        }
        password_input.value = '';
        password_input.focus();
    }
}

/* Trigger decryption process */
function init_decryptor() {
    var password_input = document.getElementById('mkdocs-content-password');
    // adjust password field width to placeholder length
    password_input.setAttribute('size', password_input.getAttribute('placeholder').length);
    var encrypted_content = document.getElementById('mkdocs-encrypted-content');
    var decrypted_content = document.getElementById('mkdocs-decrypted-content');
    /* If remember_password is set, try to use sessionStorage/localstorage item to decrypt content when page is loaded */
    let password_cookie = getItemExpiry(encryptcontent_path);
    if (password_cookie) {
        password_input.value = password_cookie.value;
        let content_decrypted = decrypt_action(
            password_input, encrypted_content, decrypted_content
        );
        decryptor_reaction(content_decrypted, password_input, password_cookie.fallback, false, false); //dont save cookie as it was loaded from cookie
    }
    
    /* Default, try decrypt content when key (ctrl) enter is press */
    password_input.addEventListener('keypress', function(event) {
        let set_global = false;
        if (event.key === "Enter") {
            if (event.ctrlKey) {
                set_global = true;
            }
            event.preventDefault();
            let content_decrypted = decrypt_action(
                password_input, encrypted_content, decrypted_content
            );
            decryptor_reaction(content_decrypted, password_input, false, set_global, true); //no fallback, set_global?, save cookie
        }
    });
}

document.addEventListener('DOMContentLoaded', init_decryptor());