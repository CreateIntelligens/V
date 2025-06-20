"""
HeyGem 數字人生成器 - Web客戶端
"""

import streamlit as st
import tempfile
import os
import io
import time
from api_client import HeyGemAPIClient

# 使用統一配置（內建環境檢測）
from config import APP_CONFIG, DEBUG, ENV_INFO

# 設置頁面配置
st.set_page_config(
    page_title=APP_CONFIG["title"],
    page_icon="🎭",
    layout="wide",
    initial_sidebar_state="expanded"
)

def init_session_state():
    """初始化會話狀態"""
    if 'client' not in st.session_state:
        st.session_state.client = HeyGemAPIClient()
    if 'task_history' not in st.session_state:
        st.session_state.task_history = []
    if 'current_task' not in st.session_state:
        st.session_state.current_task = None

def validate_file(uploaded_file, file_type="audio"):
    """驗證上傳的文件"""
    if uploaded_file is None:
        return False, "請上傳文件"
    
    # 檢查文件大小
    if uploaded_file.size > APP_CONFIG["max_file_size"]:
        return False, f"文件大小超過限制 ({APP_CONFIG['max_file_size'] // (1024*1024)}MB)"
    
    # 檢查文件格式
    file_extension = os.path.splitext(uploaded_file.name)[1].lower()
    
    if file_type == "audio":
        supported_formats = APP_CONFIG["supported_audio_formats"]
    else:
        supported_formats = APP_CONFIG["supported_video_formats"]
    
    if file_extension not in supported_formats:
        return False, f"不支持的文件格式。支持的格式: {', '.join(supported_formats)}"
    
    return True, "文件驗證通過"

def save_uploaded_file(uploaded_file):
    """保存上傳的文件到臨時目錄"""
    try:
        # 創建臨時文件
        suffix = os.path.splitext(uploaded_file.name)[1]
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_file.write(uploaded_file.getvalue())
        temp_file.close()
        return True, temp_file.name
    except Exception as e:
        return False, f"保存文件失敗: {str(e)}"

def cleanup_temp_file(file_path):
    """清理臨時文件"""
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
    except Exception as e:
        if DEBUG:
            st.error(f"清理臨時文件失敗: {str(e)}")

def display_task_history():
    """顯示任務歷史"""
    if st.session_state.task_history:
        st.subheader("📋 任務歷史")
        for i, task in enumerate(reversed(st.session_state.task_history[-10:])):  # 只顯示最近10個
            with st.expander(f"任務 {len(st.session_state.task_history) - i}: {task['status']}"):
                st.write(f"**提交時間**: {task['timestamp']}")
                st.write(f"**狀態**: {task['status']}")
                st.write(f"**消息**: {task['message']}")
                if task.get('result_url'):
                    st.write(f"**結果**: [下載影片]({task['result_url']})")

def main():
    """主應用程式"""
    init_session_state()
    
    # 頁面標題
    st.title("" + APP_CONFIG["title"])
    st.markdown(APP_CONFIG["description"])
    
    # 側邊欄 - 配置和幫助
    with st.sidebar:
        st.header("⚙️ 設置")
        
        # 遠端服務器狀態
        with st.expander("🌐 服務器信息"):
            st.write(f"**環境**: {ENV_INFO['type']}")
            st.write(f"**服務器**: {ENV_INFO['host']}")
            st.write("**服務端點**:")
            for service, url in ENV_INFO['endpoints'].items():
                st.write(f"- {service}: {url}")
        
        # 幫助信息
        with st.expander("❓ 使用說明"):
            st.markdown("""
            ### 使用步驟：
            1. 上傳音頻文件（聲音來源）
            2. 上傳影片文件（人物形象）
            3. 點擊「開始生成」
            4. 等待處理完成
            5. 下載生成的數字人影片
            
            ### 支持格式：
            - **音頻**: WAV, MP3, M4A
            - **影片**: MP4, AVI, MOV
            
            ### 注意事項：
            - 文件大小限制: 100MB
            - 處理時間取決於文件大小
            - 確保網路連接穩定
            """)
    
    # 主要內容區域
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🎵 音頻文件")
        audio_file = st.file_uploader(
            "上傳音頻文件",
            type=['wav', 'mp3', 'm4a'],
            help="選擇要用作聲音來源的音頻文件"
        )
        
        if audio_file:
            # 播放音頻預覽
            st.audio(audio_file)
            
            # 顯示文件信息
            st.write(f"**文件名**: {audio_file.name}")
            st.write(f"**大小**: {audio_file.size / (1024*1024):.2f} MB")
    
    with col2:
        st.subheader("🎬 影片文件")
        video_file = st.file_uploader(
            "上傳影片文件",
            type=['mp4', 'avi', 'mov'],
            help="選擇要用作人物形象的影片文件"
        )
        
        if video_file:
            # 播放影片預覽
            st.video(video_file)
            
            # 顯示文件信息
            st.write(f"**文件名**: {video_file.name}")
            st.write(f"**大小**: {video_file.size / (1024*1024):.2f} MB")
    
    # 生成按鈕和處理邏輯
    st.markdown("---")
    
    # 檢查文件是否都已上傳
    files_ready = audio_file is not None and video_file is not None
    
    if not files_ready:
        st.warning("請上傳音頻和影片文件後再繼續")
    
    # 生成按鈕
    col_btn1, col_btn2, col_btn3 = st.columns([1, 2, 1])
    with col_btn2:
        if st.button(
            "🚀 開始生成數字人影片", 
            disabled=not files_ready,
            use_container_width=True,
            type="primary"
        ):
            # 驗證文件
            audio_valid, audio_msg = validate_file(audio_file, "audio")
            video_valid, video_msg = validate_file(video_file, "video")
            
            if not audio_valid:
                st.error(f"音頻文件錯誤: {audio_msg}")
                return
            
            if not video_valid:
                st.error(f"影片文件錯誤: {video_msg}")
                return
            
            # 開始處理
            with st.spinner("正在提交任務..."):
                # 提交任務
                success, message, task_code = st.session_state.client.upload_files_and_submit(
                    audio_file, video_file
                )
                
                if success:
                    st.session_state.current_task = {
                        'code': task_code,
                        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                        'status': '處理中',
                        'message': message
                    }
                    
                    st.success(f"任務提交成功! 任務代碼: {task_code}")
                    
                    # 顯示處理進度
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    
                    def update_progress(progress, msg):
                        progress_bar.progress(progress / 100)
                        status_text.text(f"處理進度: {progress}% - {msg}")
                    
                    # 等待完成
                    with st.spinner("正在生成數字人影片，請耐心等待..."):
                        success, message, result_url = st.session_state.client.wait_for_completion(
                            task_code, update_progress
                        )
                    
                    # 更新任務狀態
                    st.session_state.current_task.update({
                        'status': '完成' if success else '失敗',
                        'message': message,
                        'result_url': result_url if success else None
                    })
                    
                    # 添加到歷史記錄
                    st.session_state.task_history.append(st.session_state.current_task.copy())
                    
                    if success:
                        st.success("🎉 數字人影片生成完成!")
                        st.markdown(f"**下載鏈接**: [點擊下載影片]({result_url})")
                        
                        # 嘗試顯示結果影片（如果可以直接訪問）
                        try:
                            st.video(result_url)
                        except:
                            st.info("無法直接預覽影片，請點擊下載鏈接")
                    else:
                        st.error(f"處理失敗: {message}")
                        
                    progress_bar.empty()
                    status_text.empty()
                    
                else:
                    st.error(f"任務提交失敗: {message}")
                    st.session_state.task_history.append({
                        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                        'status': '提交失敗',
                        'message': message
                    })
    
    # 顯示當前任務狀態
    if st.session_state.current_task:
        st.markdown("---")
        st.subheader("📊 當前任務狀態")
        task = st.session_state.current_task
        
        col_status1, col_status2, col_status3 = st.columns(3)
        with col_status1:
            st.metric("狀態", task['status'])
        with col_status2:
            st.metric("任務代碼", task['code'][:8] + "...")
        with col_status3:
            st.metric("提交時間", task['timestamp'])
        
        st.write(f"**消息**: {task['message']}")
        
        if task.get('result_url'):
            st.markdown(f"**結果**: [下載影片]({task['result_url']})")
    
    # 顯示任務歷史
    if st.session_state.task_history:
        st.markdown("---")
        display_task_history()
    
    # 頁腳
    st.markdown("---")
    st.markdown(
        """
        <div style='text-align: center; color: #666;'>
        🚀 HeyGem 數字人生成器 | 基於 Streamlit 開發
        </div>
        """, 
        unsafe_allow_html=True
    )

if __name__ == "__main__":
    main()
