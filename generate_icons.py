#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信小程序TabBar图标生成器
生成符合81x81px规范的图标
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, bg_color, shape_type, icon_color, text=""):
    """创建81x81px的图标"""
    # 创建透明背景的图像
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制圆形背景
    margin = 2
    draw.ellipse([margin, margin, size-margin, size-margin], fill=bg_color)
    
    # 绘制图标形状
    center_x, center_y = size // 2, size // 2
    
    if shape_type == "home":
        # 绘制房子形状
        house_points = [
            (center_x - 12, center_y + 8),
            (center_x - 12, center_y - 2),
            (center_x, center_y - 12),
            (center_x + 12, center_y - 2),
            (center_x + 12, center_y + 8),
            (center_x - 12, center_y + 8)
        ]
        draw.polygon(house_points, fill=icon_color)
        
        # 绘制房子门
        door_rect = [center_x - 4, center_y, center_x + 4, center_y + 8]
        draw.rectangle(door_rect, fill='white')
        
        # 绘制窗户
        window1 = [center_x - 8, center_y - 6, center_x - 2, center_y]
        window2 = [center_x + 2, center_y - 6, center_x + 8, center_y]
        draw.rectangle(window1, fill='white')
        draw.rectangle(window2, fill='white')
        
    elif shape_type == "forum":
        # 绘制对话框
        dialog_points = [
            (center_x - 15, center_y - 12),
            (center_x + 15, center_y - 12),
            (center_x + 15, center_y + 8),
            (center_x + 8, center_y + 8),
            (center_x + 2, center_y + 15),
            (center_x + 2, center_y + 8),
            (center_x - 15, center_y + 8)
        ]
        draw.polygon(dialog_points, fill=icon_color)
        
        # 绘制消息内容点
        dot_y = center_y - 4
        draw.ellipse([center_x - 8, dot_y - 1, center_x - 6, dot_y + 1], fill='white')
        draw.ellipse([center_x - 1, dot_y - 1, center_x + 1, dot_y + 1], fill='white')
        draw.ellipse([center_x + 6, dot_y - 1, center_x + 8, dot_y + 1], fill='white')
        
    elif shape_type == "knowledge":
        # 绘制书本
        book_points = [
            (center_x - 12, center_y - 8),
            (center_x + 12, center_y - 8),
            (center_x + 12, center_y + 12),
            (center_x - 12, center_y + 12),
            (center_x - 12, center_y - 8)
        ]
        draw.polygon(book_points, fill=icon_color)
        
        # 绘制书页线
        draw.line([center_x - 10, center_y, center_x + 10, center_y], fill='white', width=2)
        draw.line([center_x, center_y - 6, center_x, center_y + 10], fill='white', width=1)
        
    elif shape_type == "settings":
        # 绘制齿轮
        import math
        teeth = 8
        outer_radius = 15
        inner_radius = 10
        center = center_x, center_y
        
        # 绘制齿轮外圈
        for i in range(teeth):
            angle1 = (2 * math.pi * i) / teeth
            angle2 = (2 * math.pi * (i + 0.5)) / teeth
            
            x1 = center_x + outer_radius * math.cos(angle1)
            y1 = center_y + outer_radius * math.sin(angle1)
            x2 = center_x + inner_radius * math.cos(angle2)
            y2 = center_y + inner_radius * math.sin(angle2)
            
            if i == 0:
                points = [(x1, y1), (x2, y2)]
            else:
                points.append((x1, y1))
                points.append((x2, y2))
        
        if points:
            draw.polygon(points, fill=icon_color)
        
        # 绘制齿轮中心
        draw.ellipse([center_x - 6, center_y - 6, center_x + 6, center_y + 6], fill='white')
    
    return img

def main():
    """主函数：生成所有tabBar图标"""
    size = 81
    
    # 图标配置
    icons_config = [
        {
            "name": "home",
            "normal": {"bg": "#999999", "icon": "white"},
            "active": {"bg": "#4CAF50", "icon": "white"}
        },
        {
            "name": "forum", 
            "normal": {"bg": "#999999", "icon": "white"},
            "active": {"bg": "#2196F3", "icon": "white"}
        },
        {
            "name": "knowledge",
            "normal": {"bg": "#999999", "icon": "white"}, 
            "active": {"bg": "#FF9800", "icon": "white"}
        },
        {
            "name": "settings",
            "normal": {"bg": "#999999", "icon": "white"},
            "active": {"bg": "#9C27B0", "icon": "white"}
        }
    ]
    
    # 确保icons目录存在
    os.makedirs("icons", exist_ok=True)
    
    # 生成图标
    for config in icons_config:
        name = config["name"]
        
        # 生成普通状态图标
        normal_img = create_icon(
            size, 
            config["normal"]["bg"], 
            name, 
            config["normal"]["icon"]
        )
        normal_img.save(f"icons/{name}.png")
        print(f"✓ 生成 {name}.png")
        
        # 生成活跃状态图标
        active_img = create_icon(
            size,
            config["active"]["bg"],
            name,
            config["active"]["icon"]
        )
        active_img.save(f"icons/{name}-active.png")
        print(f"✓ 生成 {name}-active.png")
    
    print("\n🎉 所有tabBar图标生成完成！")
    print("📋 生成的图标符合微信小程序规范：")
    print("   - 尺寸：81x81像素")
    print("   - 格式：PNG")
    print("   - 背景：透明")

if __name__ == "__main__":
    main()