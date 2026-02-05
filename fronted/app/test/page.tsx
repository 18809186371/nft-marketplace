export default function TestPage() {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-purple-50">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Tailwind CSS v4 测试</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 bg-blue-500 text-white rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold">蓝色卡片</h2>
          <p>使用 bg-blue-500 类</p>
        </div>
        <div className="p-6 bg-green-500 text-white rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold">绿色卡片</h2>
          <p>使用 bg-green-500 类</p>
        </div>
        <div className="p-6 bg-red-500 text-white rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold">红色卡片</h2>
          <p>使用 bg-red-500 类</p>
        </div>
      </div>

      <div className="mb-8">
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md">
          测试按钮 - 悬停有效果
        </button>
      </div>

      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
        <p className="font-medium">诊断结果：</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>如果卡片有颜色、圆角和阴影 → Tailwind基础样式正常</li>
          <li>按钮悬停变色 → 状态变体正常</li>
          <li>网格响应式布局 → 响应式功能正常</li>
        </ul>
      </div>
    </div>
  )
}