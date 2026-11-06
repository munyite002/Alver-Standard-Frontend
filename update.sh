#!/usr/bin/env bash

set -e

echo "Stopping Dashboard Service"
pm2 stop alver-stron-admin

echo "Pulling Latest Changes..."
git pull https://munyite001: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@github.com/ALVER-POWER/ALVER-STRON-ADMIN-PANEL.git master

echo "Updating and installing dependencies"
npm install --legacy-peer-deps

echo "Restarting Dashboard Service"
pm2 start alver-stron-admin

echo "Updating Dashboard Service Completed Successfully"


