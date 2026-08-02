#!/bin/bash
echo "Installing nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
echo "✅ nvm installed! Please run: source ~/.zshrc && nvm install 18 && nvm use 18"
