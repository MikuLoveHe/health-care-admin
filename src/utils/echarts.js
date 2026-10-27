/**
 * ECharts 按需引入
 *
 * 只注册项目实际用到的图表与组件，避免把完整 echarts 打进产物：
 *   - 图表：柱状图、折线图、饼图
 *   - 组件：提示框、图例、直角坐标系、标题、坐标轴指示器
 *   - 渲染器：Canvas
 *
 * 新增图表类型时，在下方同时补充对应的 Chart / Component，否则图表不会渲染。
 */
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  AxisPointerComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  AxisPointerComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
])

export default echarts
