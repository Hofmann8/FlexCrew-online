import unittest
from app import create_app

class TestAPI(unittest.TestCase):
    """API测试类"""
    
    def setUp(self):
        """测试前准备"""
        self.app = create_app('development')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
    
    def tearDown(self):
        """测试后清理"""
        self.app_context.pop()
    
    def test_index(self):
        """测试根路由"""
        response = self.client.get('/')
        json_data = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json_data['status'], 'success')
    
    def test_info(self):
        """测试社团信息接口"""
        response = self.client.get('/api/info')
        json_data = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertIn('name', json_data)
        self.assertIn('description', json_data)
    
    def test_styles(self):
        """测试舞蹈风格接口"""
        response = self.client.get('/api/styles')
        json_data = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertIn('styles', json_data)
        self.assertTrue(len(json_data['styles']) > 0)
    
if __name__ == '__main__':
    unittest.main() 