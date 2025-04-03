"""
检查和设置Cookie的测试工具

使用方法:
1. 在Flask应用中导入并注册路由:
   from check_cookie import setup_cookie_routes
   setup_cookie_routes(app)

2. 访问以下URL进行测试:
   - /check-cookie - 显示当前所有cookie
   - /set-cookie - 设置测试cookie
"""

from flask import jsonify, request, make_response

def setup_cookie_routes(app):
    """设置Cookie调试路由"""
    
    @app.route('/check-cookie')
    def check_cookie():
        """显示所有cookie"""
        result = {
            'cookies': {key: value for key, value in request.cookies.items()}
        }
        return jsonify(result)
    
    @app.route('/set-cookie')
    def set_cookie():
        """设置测试cookie"""
        response = make_response(jsonify({
            'message': 'Cookie已设置',
            'status': 'success'
        }))
        
        response.set_cookie('test_cookie', 'test_value', 
                           httponly=True, 
                           secure=False,
                           samesite=None,
                           max_age=3600)
        
        return response
    
    @app.route('/api/auth/test-cookie-auth', methods=['GET'])
    def test_cookie_auth():
        """测试Cookie认证"""
        from flask_jwt_extended import create_access_token, set_access_cookies
        
        # 创建一个测试token (用户ID=999)
        access_token = create_access_token(identity=str(999))
        
        response = jsonify({
            'success': True,
            'message': 'JWT Cookie已设置用于测试'
        })
        
        # 设置JWT Cookie
        set_access_cookies(response, access_token)
        
        return response
    
if __name__ == "__main__":
    print("这是一个库文件，请通过Flask应用导入") 