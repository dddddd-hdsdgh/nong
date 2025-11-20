#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
微信小程序TabBar图标调试脚本
帮助用户排查图标不显示的问题
"""

import os
import json
from pathlib import Path

def check_config_files():
    """检查配置文件和图标文件"""
    print("🔍 检查配置文件和图标文件...")
    print("="*50)
    
    # 检查 pages.json
    if os.path.exists("pages.json"):
        with open("pages.json", "r", encoding="utf-8") as f:
            pages_data = json.load(f)
        
        if "tabBar" in pages_data and "list" in pages_data["tabBar"]:
            print("📋 TabBar配置：")
            tab_list = pages_data["tabBar"]["list"]
            
            for i, item in enumerate(tab_list, 1):
                page_name = item.get("text", f"Tab{i}")
                icon_path = item.get("iconPath", "")
                selected_path = item.get("selectedIconPath", "")
                
                print(f"  {i}. {page_name}:")
                print(f"     普通图标: {icon_path}")
                print(f"     选中图标: {selected_path}")
                
                # 检查文件是否存在
                if os.path.exists(icon_path):
                    size = os.path.getsize(icon_path)
                    print(f"     ✅ {icon_path} 存在 ({size} bytes)")
                else:
                    print(f"     ❌ {icon_path} 不存在")
                    
                if os.path.exists(selected_path):
                    size = os.path.getsize(selected_path)
                    print(f"     ✅ {selected_path} 存在 ({size} bytes)")
                else:
                    print(f"     ❌ {selected_path} 不存在")
        else:
            print("❌ pages.json 中未找到 TabBar 配置")
    else:
        print("❌ pages.json 文件不存在")
    
    print()

def check_file_permissions():
    """检查文件权限和路径"""
    print("🔍 检查文件路径和权限...")
    print("="*50)
    
    icon_dir = "icons"
    if os.path.exists(icon_dir):
        print(f"✅ icons 目录存在: {os.path.abspath(icon_dir)}")
        files = os.listdir(icon_dir)
        print(f"📁 icons 目录中的文件: {', '.join(sorted(files))}")
        
        # 检查是否有隐藏文件或不可访问的文件
        for file in files:
            file_path = os.path.join(icon_dir, file)
            if os.path.isfile(file_path):
                try:
                    stat = os.stat(file_path)
                    print(f"  📄 {file}: {stat.st_size} bytes, 权限: {oct(stat.st_mode)[-3:]}")
                except Exception as e:
                    print(f"  ❌ {file}: 无法访问 - {e}")
    else:
        print("❌ icons 目录不存在")
    
    print()

def generate_debug_steps():
    """生成调试步骤建议"""
    print("🚀 图标显示问题解决方案")
    print("="*50)
    
    solutions = [
        "1. 🔄 在微信开发者工具中点击 '编译' (Ctrl+B)",
        "2. 🗑️ 点击 '工具' → '编译' → '清缓存' → '全部清除'",
        "3. 🔌 关闭微信开发者工具，重新打开项目",
        "4. 📱 检查项目设置 → '本地设置' → 确保 '不校验合法域名' 已勾选",
        "5. 📂 确保项目根目录有 app.json 文件",
        "6. 🏗️ 检查 project.config.json 中的 appid 是否正确",
        "7. 💾 尝试 '工具' → '编译' → '重新导入项目'",
        "8. 📱 在模拟器中手动刷新页面 (F5)"
    ]
    
    for solution in solutions:
        print(f"  {solution}")
    
    print()
    print("🎯 如果问题仍然存在，请检查：")
    print("  - 微信开发者工具是否为最新版本")
    print("  - 小程序基础库版本是否过旧")
    print("  - 是否有其他配置文件覆盖了 TabBar 设置")

if __name__ == "__main__":
    print("🔧 微信小程序 TabBar 图标调试工具")
    print("="*50)
    print()
    
    check_config_files()
    check_file_permissions()
    generate_debug_steps()
    
    print("🔧 调试完成！按照上述步骤操作后，图标应该能正常显示。")