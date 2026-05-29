/* global Office */

(function () {
  "use strict";

  var ATTACHMENT_BUDGET_BYTES = 3 * 1024 * 1024;

  var els = {};
  var ready = false;

  Office.onReady(function (info) {
    if (info.host !== Office.HostType.Outlook) {
      return;
    }

    els.subject = document.getElementById("subjectPreview");
    els.workspace = document.getElementById("workspace");
    els.caseId = document.getElementById("caseId");
    els.sendBtn = document.getElementById("sendBtn");
    els.status = document.getElementById("status");
    els.baseUrl = document.getElementById("baseUrl");
    els.token = document.getElementById("token");
    els.saveSettingsBtn = document.getElementById("saveSettingsBtn");

    loadSettings();

    var item = Office.context.mailbox.item;
    els.subject.textContent = (item && item.subject) ? item.subject : "(no subject)";

    els.sendBtn.disabled = false;
    ready = true;

    els.sendBtn.addEventListener("click", onSend);
    els.saveSettingsBtn.addEventListener("click", saveSettings);
  });

  function loadSettings() {
    var rs = Office.context.roamingSettings;
    var token = rs.get("ingestToken") || "";
    var baseUrl = rs.get("baseUrl") || "";
    var workspace = rs.get("defaultWorkspace") || "Import/Staging";

    els.token.value = token;
    els.baseUrl.value = baseUrl;
    els.workspace.value = workspace;

    if (!token) {
      setStatus("Add your ingest token under Settings to enable capture.", "err");
    }
  }

  function saveSettings() {
    var rs = Office.context.roamingSettings;
    rs.set("ingestToken", els.token.value.trim());
    rs.set("baseUrl", els.baseUrl.value.trim());
    rs.set("defaultWorkspace", els.workspace.value);
    rs.saveAsync(function (res) {
      if (res.status === Office.AsyncResultStatus.Succeeded) {
        setStatus("Settings saved.", "ok");
      } else {
        setStatus("Could not save settings.", "err");
      }
    });
  }

  function setStatus(text, kind) {
    els.status.textContent = text;
    els.status.className = "status" + (kind ? " " + kind : "");
  }

  function resolveBaseUrl() {
    var configured = (els.baseUrl.value || "").trim().replace(/\/+$/, "");
    if (configured) {
      return configured;
    }
    return window.location.origin;
  }

  function getBodyText() {
    return new Promise(function (resolve) {
      Office.context.mailbox.item.body.getAsync(Office.CoercionType.Text, function (res) {
        resolve(res.status === Office.AsyncResultStatus.Succeeded ? (res.value || "") : "");
      });
    });
  }

  function getInternetHeaders() {
    return new Promise(function (resolve) {
      var item = Office.context.mailbox.item;
      if (!item.getAllInternetHeadersAsync) {
        resolve("");
        return;
      }
      try {
        item.getAllInternetHeadersAsync(function (res) {
          resolve(res.status === Office.AsyncResultStatus.Succeeded ? (res.value || "") : "");
        });
      } catch (e) {
        resolve("");
      }
    });
  }

  function headerValue(rawHeaders, name) {
    if (!rawHeaders) {
      return "";
    }
    var re = new RegExp("^" + name + ":\\s*(.*)$", "im");
    var match = rawHeaders.match(re);
    return match ? match[1].trim() : "";
  }

  function addressText(addr) {
    if (!addr) {
      return "";
    }
    if (addr.displayName && addr.emailAddress && addr.displayName !== addr.emailAddress) {
      return addr.displayName + " <" + addr.emailAddress + ">";
    }
    return addr.emailAddress || addr.displayName || "";
  }

  function addressList(list) {
    return (list || []).map(addressText).filter(Boolean);
  }

  function getAttachmentContent(id) {
    return new Promise(function (resolve) {
      var item = Office.context.mailbox.item;
      if (!item.getAttachmentContentAsync) {
        resolve(null);
        return;
      }
      try {
        item.getAttachmentContentAsync(id, function (res) {
          if (res.status === Office.AsyncResultStatus.Succeeded &&
              res.value && res.value.format === Office.MailboxEnums.AttachmentContentFormat.Base64) {
            resolve(res.value.content);
          } else {
            resolve(null);
          }
        });
      } catch (e) {
        resolve(null);
      }
    });
  }

  function collectAttachments() {
    var item = Office.context.mailbox.item;
    var list = item.attachments || [];
    var budget = ATTACHMENT_BUDGET_BYTES;

    var jobs = list.map(function (att) {
      var meta = {
        name: att.name || "attachment.bin",
        contentType: att.contentType || "application/octet-stream",
        sizeBytes: typeof att.size === "number" ? att.size : null,
        contentBase64: null
      };

      var isFile = att.attachmentType === Office.MailboxEnums.AttachmentType.File;
      if (!isFile || (att.size && att.size > budget)) {
        return Promise.resolve(meta);
      }

      return getAttachmentContent(att.id).then(function (content) {
        if (content) {
          var bytes = Math.floor((content.length * 3) / 4);
          if (bytes <= budget) {
            budget -= bytes;
            meta.contentBase64 = content;
          }
        }
        return meta;
      });
    });

    return Promise.all(jobs);
  }

  function onSend() {
    if (!ready) {
      return;
    }

    var token = (els.token.value || "").trim();
    if (!token) {
      setStatus("Add your ingest token under Settings first.", "err");
      return;
    }

    els.sendBtn.disabled = true;
    setStatus("Capturing\u2026");

    var item = Office.context.mailbox.item;

    Promise.all([getBodyText(), getInternetHeaders(), collectAttachments()])
      .then(function (results) {
        var bodyText = results[0];
        var rawHeaders = results[1];
        var attachments = results[2];

        var references = headerValue(rawHeaders, "References")
          .split(/\s+/)
          .filter(Boolean);

        var payload = {
          subject: item.subject || "",
          from: addressText(item.from),
          to: addressList(item.to),
          cc: addressList(item.cc),
          sentAt: item.dateTimeCreated ? new Date(item.dateTimeCreated).toISOString() : null,
          messageId: item.internetMessageId || headerValue(rawHeaders, "Message-ID") || null,
          inReplyTo: headerValue(rawHeaders, "In-Reply-To") || null,
          references: references,
          bodyText: bodyText,
          attachments: attachments,
          workspaceAssignment: els.workspace.value,
          linkedCaseId: (els.caseId.value || "").trim() || null
        };

        return fetch(resolveBaseUrl() + "/api/ingest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify(payload)
        });
      })
      .then(function (resp) {
        return resp.json().then(function (data) {
          return { ok: resp.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.data.ok) {
          var msg = (result.data && (result.data.error || result.data.note)) || "Capture failed.";
          setStatus(msg, "err");
          els.sendBtn.disabled = false;
          return;
        }

        var d = result.data;
        var note = "Captured.";
        if (d.metadataOnlyAttachments > 0) {
          note += " " + d.capturedAttachments + " attachment(s) included, " +
            d.metadataOnlyAttachments + " too large (metadata only).";
        } else if (d.capturedAttachments > 0) {
          note += " " + d.capturedAttachments + " attachment(s) included.";
        }
        setStatus(note, "ok");
      })
      .catch(function (err) {
        setStatus("Network error: " + (err && err.message ? err.message : "unknown"), "err");
        els.sendBtn.disabled = false;
      });
  }
})();
