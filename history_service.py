# history_service.py
from database import db
from datetime import datetime

class HistoryService:
    
    @staticmethod
    def save_session(session_data):
        return db.save_session(session_data)
    
    @staticmethod
    def get_history(limit=100):
        history = db.get_history(limit)
        
        # Format the results
        formatted = []
        for item in history:
            # Format date
            date_obj = datetime.strptime(str(item['date']), '%Y-%m-%d')
            date_str = date_obj.strftime('%a, %d %b %Y')
            
            formatted.append({
                'id': item['id'],
                'date': item['date'],
                'dateStr': date_str,
                'start_time': item['start_time'],
                'end_time': item['end_time'],
                'timeRange': f"{item['start_time']} - {item['end_time']}",
                'mode': item['mode'],
                'task': item['task'],
                'duration': item['duration'],
                'lblClass': HistoryService._get_label_class(item['mode'])
            })
        
        return formatted
    
    @staticmethod
    def _get_label_class(mode):
        if 'Pmodoro' in mode:
            return 'lbl-focus'
        elif 'Short' in mode:
            return 'lbl-short'
        elif 'Long' in mode:
            return 'lbl-long'
        return 'lbl-focus'
    
    @staticmethod
    def get_total_hours():
        return db.get_total_hours()
    
    @staticmethod
    def clear_history():
        return db.clear_history()

# Global instance
history_service = HistoryService()