const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

const serviceSource = `package com.khalidouassi.khfloatinghub;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.PopupWindow;
import android.widget.TextView;

public class FloatingBubbleService extends Service {
  private WindowManager windowManager;
  private View bubble;
  private WindowManager.LayoutParams params;
  private float downX;
  private float downY;
  private int startX;
  private int startY;

  public static void start(Context context) {
    if (Settings.canDrawOverlays(context)) {
      context.startService(new Intent(context, FloatingBubbleService.class));
    }
  }

  @Override
  public void onCreate() {
    super.onCreate();
    if (!Settings.canDrawOverlays(this)) return;

    windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
    bubble = new TextView(this);
    ((TextView) bubble).setText("KH");
    ((TextView) bubble).setTextColor(Color.rgb(11, 11, 10));
    ((TextView) bubble).setTextSize(16);
    ((TextView) bubble).setGravity(Gravity.CENTER);
    ((TextView) bubble).setTypeface(null, 1);

    GradientDrawable background = new GradientDrawable();
    background.setColor(Color.rgb(215, 163, 61));
    background.setShape(GradientDrawable.OVAL);
    bubble.setBackground(background);
    bubble.setElevation(18);

    int overlayType = android.os.Build.VERSION.SDK_INT >= 26
      ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
      : WindowManager.LayoutParams.TYPE_PHONE;
    params = new WindowManager.LayoutParams(
      68,
      68,
      overlayType,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
      PixelFormat.TRANSLUCENT
    );
    params.gravity = Gravity.TOP | Gravity.START;
    params.x = 24;
    params.y = 220;

    bubble.setOnTouchListener((view, event) -> {
      switch (event.getAction()) {
        case MotionEvent.ACTION_DOWN:
          downX = event.getRawX();
          downY = event.getRawY();
          startX = params.x;
          startY = params.y;
          return true;
        case MotionEvent.ACTION_MOVE:
          params.x = startX + (int) (event.getRawX() - downX);
          params.y = startY + (int) (event.getRawY() - downY);
          windowManager.updateViewLayout(bubble, params);
          return true;
        case MotionEvent.ACTION_UP:
          if (Math.abs(event.getRawX() - downX) < 10 && Math.abs(event.getRawY() - downY) < 10) {
            showShortcuts();
          }
          return true;
        default:
          return false;
      }
    });

    windowManager.addView(bubble, params);
  }

  private void showShortcuts() {
    LinearLayout list = new LinearLayout(this);
    list.setOrientation(LinearLayout.VERTICAL);
    list.setPadding(16, 10, 16, 10);
    GradientDrawable panel = new GradientDrawable();
    panel.setColor(Color.rgb(21, 21, 19));
    panel.setCornerRadius(28);
    list.setBackground(panel);

    addShortcut(list, "WhatsApp", "com.whatsapp");
    addShortcut(list, "YouTube", "com.google.android.youtube");
    addShortcut(list, "Telegram", "org.telegram.messenger");
    addShortcut(list, "المتصفح", "com.android.chrome");

    PopupWindow popup = new PopupWindow(list, 220, -2, true);
    popup.setBackgroundDrawable(panel);
    popup.setOutsideTouchable(true);
    popup.setElevation(18);
    popup.showAtLocation(bubble, Gravity.TOP | Gravity.START, Math.max(8, params.x), Math.max(40, params.y - 210));
  }

  private void addShortcut(LinearLayout list, String label, String packageName) {
    TextView item = new TextView(this);
    item.setText(label);
    item.setTextColor(Color.rgb(247, 242, 232));
    item.setTextSize(14);
    item.setGravity(Gravity.CENTER_VERTICAL | Gravity.RIGHT);
    item.setPadding(18, 14, 18, 14);
    item.setOnClickListener(view -> {
      Intent launch = getPackageManager().getLaunchIntentForPackage(packageName);
      if (launch != null) {
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(launch);
      }
    });
    list.addView(item);
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    if (bubble != null && windowManager != null) windowManager.removeView(bubble);
  }

  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }
}
`;

module.exports = function withFloatingService(config) {
  config = withAndroidManifest(config, (manifestConfig) => {
    const manifest = manifestConfig.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    if (!manifest['uses-permission'].some((permission) => permission.$['android:name'] === 'android.permission.SYSTEM_ALERT_WINDOW')) {
      manifest['uses-permission'].push({ $: { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW' } });
    }
    const application = manifest.application[0];
    application.service = application.service || [];
    if (!application.service.some((service) => service.$['android:name'] === '.FloatingBubbleService')) {
      application.service.push({
        $: {
          'android:name': '.FloatingBubbleService',
          'android:exported': 'false',
        },
      });
    }
    return manifestConfig;
  });

  return withDangerousMod(config, ['android', async (dangerousConfig) => {
    const androidRoot = dangerousConfig.modRequest.platformProjectRoot;
    const packageRoot = path.join(androidRoot, 'app', 'src', 'main', 'java', 'com', 'khalidouassi', 'khfloatinghub');
    fs.mkdirSync(packageRoot, { recursive: true });
    fs.writeFileSync(path.join(packageRoot, 'FloatingBubbleService.java'), serviceSource);

    const activityPath = path.join(packageRoot, 'MainActivity.kt');
    if (fs.existsSync(activityPath)) {
      let activity = fs.readFileSync(activityPath, 'utf8');
      if (!activity.includes('FloatingBubbleService.start(this)')) {
        if (activity.includes('super.onCreate(null)')) {
          activity = activity.replace('super.onCreate(null)', 'super.onCreate(null)\n    FloatingBubbleService.start(this)');
        } else if (activity.includes('class MainActivity')) {
          activity = activity.replace(
            /class MainActivity[^\\{]*\\{/,
            (match) => `${match}\n  override fun onCreate(savedInstanceState: android.os.Bundle?) {\n    super.onCreate(null)\n    FloatingBubbleService.start(this)\n  }`,
          );
        }
        fs.writeFileSync(activityPath, activity);
      }
    }
    return dangerousConfig;
  }]);
};