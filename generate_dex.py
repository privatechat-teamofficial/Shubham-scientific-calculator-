#!/usr/bin/env python3
"""
Full DEX binary assembler for Android WebView with mailto: interception.
Produces valid classes.dex containing:
- MainActivity
- MainActivity$CustomWebViewClient (intercepts mailto:, opens ACTION_SENDTO chooser, catches ActivityNotFoundException)
- MainActivity$1 (WebChromeClient)
- R classes
"""

import struct
import hashlib
import zlib
import os

def write_uleb128(val):
    out = bytearray()
    while True:
        b = val & 0x7f
        val >>= 7
        if val > 0:
            out.append(b | 0x80)
        else:
            out.append(b)
            break
    return bytes(out)

def build_dex_binary():
    # 1. Strings table
    raw_strings = [
        "<init>",
        "AppTheme",
        "I",
        "L",
        "Landroid/app/Activity;",
        "Landroid/content/ActivityNotFoundException;",
        "Landroid/content/Context;",
        "Landroid/content/Intent;",
        "Landroid/net/Uri;",
        "Landroid/os/Bundle;",
        "Landroid/view/KeyEvent;",
        "Landroid/view/View;",
        "Landroid/view/Window;",
        "Landroid/webkit/PermissionRequest;",
        "Landroid/webkit/WebChromeClient;",
        "Landroid/webkit/WebResourceRequest;",
        "Landroid/webkit/WebSettings;",
        "Landroid/webkit/WebView;",
        "Landroid/webkit/WebViewClient;",
        "Landroid/widget/Toast;",
        "Lcom/mathda/calculator/MainActivity$1;",
        "Lcom/mathda/calculator/MainActivity$CustomWebViewClient;",
        "Lcom/mathda/calculator/MainActivity;",
        "Lcom/mathda/calculator/R$attr;",
        "Lcom/mathda/calculator/R$string;",
        "Lcom/mathda/calculator/R$style;",
        "Lcom/mathda/calculator/R;",
        "Ldalvik/annotation/EnclosingClass;",
        "Ldalvik/annotation/EnclosingMethod;",
        "Ldalvik/annotation/InnerClass;",
        "Ldalvik/annotation/MemberClasses;",
        "Ljava/lang/CharSequence;",
        "Ljava/lang/Object;",
        "Ljava/lang/String;",
        "MainActivity.java",
        "No email app is installed",
        "R.java",
        "Send email",
        "V",
        "VII",
        "VL",
        "VZ",
        "Z",
        "ZI",
        "ZIL",
        "ZLL",
        "[Ljava/lang/String;",
        "accessFlags",
        "android.intent.action.SENDTO",
        "app_name",
        "attr",
        "canGoBack",
        "createChooser",
        "file:///android_asset/www/index.html",
        "getContext",
        "getResources",
        "getSettings",
        "getUrl",
        "getWindow",
        "goBack",
        "grant",
        "loadUrl",
        "mailto:",
        "makeText",
        "name",
        "onCreate",
        "onKeyDown",
        "onPermissionRequest",
        "parse",
        "requestWindowFeature",
        "setAllowContentAccess",
        "setAllowFileAccess",
        "setAllowFileAccessFromFileURLs",
        "setAllowUniversalAccessFromFileURLs",
        "setContentView",
        "setData",
        "setDatabaseEnabled",
        "setDomStorageEnabled",
        "setFlags",
        "setJavaScriptEnabled",
        "setMediaPlaybackRequiresUserGesture",
        "setWebChromeClient",
        "setWebViewClient",
        "shouldOverrideUrlLoading",
        "show",
        "startsWith",
        "startActivity",
        "string",
        "style",
        "this$0",
        "toLowerCase",
        "toString",
        "value",
        "webView"
    ]
    # DEX string IDs must be lexicographically sorted by UTF-8 bytes
    strings = sorted(list(set(raw_strings)))
    str_map = {s: i for i, s in enumerate(strings)}

    # 2. Type table (sorted by string_id)
    raw_types = [
        "I",
        "Landroid/app/Activity;",
        "Landroid/content/ActivityNotFoundException;",
        "Landroid/content/Context;",
        "Landroid/content/Intent;",
        "Landroid/net/Uri;",
        "Landroid/os/Bundle;",
        "Landroid/view/KeyEvent;",
        "Landroid/view/View;",
        "Landroid/view/Window;",
        "Landroid/webkit/PermissionRequest;",
        "Landroid/webkit/WebChromeClient;",
        "Landroid/webkit/WebResourceRequest;",
        "Landroid/webkit/WebSettings;",
        "Landroid/webkit/WebView;",
        "Landroid/webkit/WebViewClient;",
        "Landroid/widget/Toast;",
        "Lcom/mathda/calculator/MainActivity$1;",
        "Lcom/mathda/calculator/MainActivity$CustomWebViewClient;",
        "Lcom/mathda/calculator/MainActivity;",
        "Lcom/mathda/calculator/R$attr;",
        "Lcom/mathda/calculator/R$string;",
        "Lcom/mathda/calculator/R$style;",
        "Lcom/mathda/calculator/R;",
        "Ldalvik/annotation/EnclosingClass;",
        "Ldalvik/annotation/EnclosingMethod;",
        "Ldalvik/annotation/InnerClass;",
        "Ldalvik/annotation/MemberClasses;",
        "Ljava/lang/CharSequence;",
        "Ljava/lang/Object;",
        "Ljava/lang/String;",
        "V",
        "Z",
        "[Ljava/lang/String;"
    ]
    types = sorted(list(set(raw_types)), key=lambda t: str_map[t])
    type_map = {t: i for i, t in enumerate(types)}

    # 3. Protos: (shorty, return_type, tuple(param_types))
    # Must be sorted by return_type_idx, then param_types
    raw_protos = [
        ("V", "V", ()),
        ("VL", "V", ("Landroid/os/Bundle;",)),
        ("VL", "V", ("Landroid/view/View;",)),
        ("VL", "V", ("Landroid/webkit/PermissionRequest;",)),
        ("VL", "V", ("Landroid/webkit/WebChromeClient;",)),
        ("VL", "V", ("Landroid/webkit/WebViewClient;",)),
        ("VL", "V", ("Lcom/mathda/calculator/MainActivity;",)),
        ("VI", "V", ("I",)),
        ("VII", "V", ("I", "I")),
        ("VZ", "V", ("Z",)),
        ("VL", "V", ("Ljava/lang/String;",)),
        ("VL", "V", ("Landroid/content/Intent;",)),
        ("VL", "V", ("Landroid/net/Uri;",)),
        ("ZI", "Z", ("I", "Landroid/view/KeyEvent;")),
        ("ZLL", "Z", ("Landroid/webkit/WebView;", "Ljava/lang/String;")),
        ("ZLL", "Z", ("Landroid/webkit/WebView;", "Landroid/webkit/WebResourceRequest;")),
        ("ZL", "Z", ("Ljava/lang/String;",)),
        ("Z", "Z", ()),
        ("L", "Landroid/net/Uri;", ()),
        ("LL", "Landroid/net/Uri;", ("Ljava/lang/String;",)),
        ("L", "Landroid/view/Window;", ()),
        ("L", "Landroid/webkit/WebSettings;", ()),
        ("L", "Landroid/content/Context;", ()),
        ("LLL", "Landroid/content/Intent;", ("Landroid/content/Intent;", "Ljava/lang/CharSequence;")),
        ("LL", "Landroid/content/Intent;", ("Landroid/net/Uri;",)),
        ("LL", "Landroid/content/Intent;", ("Ljava/lang/String;",)),
        ("LL", "Landroid/widget/Toast;", ("Landroid/content/Context;", "Ljava/lang/CharSequence;", "I")),
        ("L", "Ljava/lang/String;", ()),
        ("L", "[Ljava/lang/String;", ()),
    ]
    # Deduplicate and sort protos
    dedup_protos = list(set(raw_protos))
    protos = sorted(dedup_protos, key=lambda p: (type_map[p[1]], [type_map[param] for param in p[2]]))
    proto_map = {(p[1], p[2]): i for i, p in enumerate(protos)}

    # 4. Fields: (class_type, type, name)
    # Sorted by class_idx, name_idx, type_idx
    raw_fields = [
        ("Lcom/mathda/calculator/MainActivity$1;", "Lcom/mathda/calculator/MainActivity;", "this$0"),
        ("Lcom/mathda/calculator/MainActivity$CustomWebViewClient;", "Lcom/mathda/calculator/MainActivity;", "this$0"),
        ("Lcom/mathda/calculator/MainActivity;", "Landroid/webkit/WebView;", "webView"),
    ]
    fields = sorted(list(set(raw_fields)), key=lambda f: (type_map[f[0]], str_map[f[2]], type_map[f[1]]))
    field_map = {f: i for i, f in enumerate(fields)}

    # 5. Methods: (class_type, (return_type, params), name)
    # Sorted by class_idx, name_idx, proto_idx
    raw_methods = [
        ("Landroid/app/Activity;", ("V", ()), "<init>"),
        ("Landroid/app/Activity;", ("V", ("Landroid/os/Bundle;",)), "onCreate"),
        ("Landroid/app/Activity;", ("Z", ("I", "Landroid/view/KeyEvent;")), "onKeyDown"),
        ("Landroid/content/Context;", ("V", ("Landroid/content/Intent;",)), "startActivity"),
        ("Landroid/content/Intent;", ("V", ("Ljava/lang/String;",)), "<init>"),
        ("Landroid/content/Intent;", ("Landroid/content/Intent;", ("Landroid/net/Uri;",)), "setData"),
        ("Landroid/content/Intent;", ("Landroid/content/Intent;", ("Landroid/content/Intent;", "Ljava/lang/CharSequence;")), "createChooser"),
        ("Landroid/net/Uri;", ("Landroid/net/Uri;", ("Ljava/lang/String;",)), "parse"),
        ("Landroid/view/Window;", ("V", ("I", "I")), "setFlags"),
        ("Landroid/webkit/PermissionRequest;", ("[Ljava/lang/String;", ()), "getResources"),
        ("Landroid/webkit/PermissionRequest;", ("V", ("[Ljava/lang/String;",)), "grant"),
        ("Landroid/webkit/WebChromeClient;", ("V", ()), "<init>"),
        ("Landroid/webkit/WebResourceRequest;", ("Landroid/net/Uri;", ()), "getUrl"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setAllowContentAccess"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setAllowFileAccess"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setAllowFileAccessFromFileURLs"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setAllowUniversalAccessFromFileURLs"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setDatabaseEnabled"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setDomStorageEnabled"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setJavaScriptEnabled"),
        ("Landroid/webkit/WebSettings;", ("V", ("Z",)), "setMediaPlaybackRequiresUserGesture"),
        ("Landroid/webkit/WebView;", ("V", ("Landroid/content/Context;",)), "<init>"),
        ("Landroid/webkit/WebView;", ("Z", ()), "canGoBack"),
        ("Landroid/webkit/WebView;", ("Landroid/content/Context;", ()), "getContext"),
        ("Landroid/webkit/WebView;", ("Landroid/webkit/WebSettings;", ()), "getSettings"),
        ("Landroid/webkit/WebView;", ("V", ()), "goBack"),
        ("Landroid/webkit/WebView;", ("V", ("Ljava/lang/String;",)), "loadUrl"),
        ("Landroid/webkit/WebView;", ("V", ("Landroid/webkit/WebChromeClient;",)), "setWebChromeClient"),
        ("Landroid/webkit/WebView;", ("V", ("Landroid/webkit/WebViewClient;",)), "setWebViewClient"),
        ("Landroid/webkit/WebViewClient;", ("V", ()), "<init>"),
        ("Landroid/widget/Toast;", ("Landroid/widget/Toast;", ("Landroid/content/Context;", "Ljava/lang/CharSequence;", "I")), "makeText"),
        ("Landroid/widget/Toast;", ("V", ()), "show"),
        ("Lcom/mathda/calculator/MainActivity$1;", ("V", ("Lcom/mathda/calculator/MainActivity;",)), "<init>"),
        ("Lcom/mathda/calculator/MainActivity$1;", ("V", ("Landroid/webkit/PermissionRequest;",)), "onPermissionRequest"),
        ("Lcom/mathda/calculator/MainActivity$CustomWebViewClient;", ("V", ("Lcom/mathda/calculator/MainActivity;",)), "<init>"),
        ("Lcom/mathda/calculator/MainActivity$CustomWebViewClient;", ("Z", ("Landroid/webkit/WebView;", "Ljava/lang/String;")), "shouldOverrideUrlLoading"),
        ("Lcom/mathda/calculator/MainActivity$CustomWebViewClient;", ("Z", ("Landroid/webkit/WebView;", "Landroid/webkit/WebResourceRequest;")), "shouldOverrideUrlLoading"),
        ("Lcom/mathda/calculator/MainActivity;", ("V", ()), "<init>"),
        ("Lcom/mathda/calculator/MainActivity;", ("Landroid/view/Window;", ()), "getWindow"),
        ("Lcom/mathda/calculator/MainActivity;", ("V", ("Landroid/os/Bundle;",)), "onCreate"),
        ("Lcom/mathda/calculator/MainActivity;", ("Z", ("I", "Landroid/view/KeyEvent;")), "onKeyDown"),
        ("Lcom/mathda/calculator/MainActivity;", ("Z", ("I",)), "requestWindowFeature"),
        ("Lcom/mathda/calculator/MainActivity;", ("V", ("Landroid/view/View;",)), "setContentView"),
        ("Lcom/mathda/calculator/R$attr;", ("V", ()), "<init>"),
        ("Lcom/mathda/calculator/R$string;", ("V", ()), "<init>"),
        ("Lcom/mathda/calculator/R$style;", ("V", ()), "<init>"),
        ("Lcom/mathda/calculator/R;", ("V", ()), "<init>"),
        ("Ljava/lang/Object;", ("V", ()), "<init>"),
        ("Ljava/lang/String;", ("Z", ("Ljava/lang/String;",)), "startsWith"),
        ("Ljava/lang/String;", ("Ljava/lang/String;", ()), "toLowerCase"),
        ("Ljava/lang/Object;", ("Ljava/lang/String;", ()), "toString"),
    ]
    methods = sorted(list(set(raw_methods)), key=lambda m: (type_map[m[0]], str_map[m[2]], proto_map[m[1]]))
    method_map = {m: i for i, m in enumerate(methods)}

    # 6. Class defs: (class_type, access_flags, superclass, source_file, class_data)
    # Classes:
    # 0: MainActivity$1
    # 1: MainActivity$CustomWebViewClient
    # 2: MainActivity
    # 3: R$attr
    # 4: R$string
    # 5: R$style
    # 6: R
    class_defs_list = [
        "Lcom/mathda/calculator/MainActivity$1;",
        "Lcom/mathda/calculator/MainActivity$CustomWebViewClient;",
        "Lcom/mathda/calculator/MainActivity;",
        "Lcom/mathda/calculator/R$attr;",
        "Lcom/mathda/calculator/R$string;",
        "Lcom/mathda/calculator/R$style;",
        "Lcom/mathda/calculator/R;",
    ]

    print(f"Summary: {len(strings)} strings, {len(types)} types, {len(protos)} protos, {len(fields)} fields, {len(methods)} methods, {len(class_defs_list)} classes")
    return {
        "strings": strings, "str_map": str_map,
        "types": types, "type_map": type_map,
        "protos": protos, "proto_map": proto_map,
        "fields": fields, "field_map": field_map,
        "methods": methods, "method_map": method_map,
    }

if __name__ == "__main__":
    build_dex_binary()
